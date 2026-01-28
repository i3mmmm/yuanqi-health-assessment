/**
 * 元炁源流健康评估系统 - 简化版后端服务器
 * 版本: 2.0 (零依赖版本)
 * 特点: 只使用 Node.js 原生模块 + 已安装的 multer
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const querystring = require('querystring');

// 加载已安装的 multer
let multer;
try {
    multer = require('multer');
} catch (e) {
    console.log('警告: multer 未安装，将使用原生文件处理');
}

// ==================== 配置部分 ====================
const PORT = process.env.PORT || 3000;
const DB_CONFIG = {
    host: process.env.DB_HOST || 'sjc1.clusters.zeabur.com',
    port: process.env.DB_PORT || 27983,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '9ODHR03Mp6hw8iYPq1en4QgrU275tEzc',
    database: process.env.DB_NAME || 'zeabur'
};

// 模拟数据库连接池
const mysql = require('mysql2/promise');
let dbConnection = null;

// ==================== 工具函数 ====================

// CORS 设置
function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// JSON 响应
function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data, null, 2));
}

// 解析请求体
function parseBody(req, callback) {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        try {
            // 尝试解析 JSON
            if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
                callback(null, JSON.parse(body));
            } else {
                // 尝试解析 URL-encoded
                callback(null, querystring.parse(body));
            }
        } catch (e) {
            callback(e, null);
        }
    });
}

// ==================== 数据库操作 ====================

async function getDbConnection() {
    if (!dbConnection) {
        dbConnection = await mysql.createConnection(DB_CONFIG);
        console.log('数据库连接成功');
    }
    return dbConnection;
}

// 测试数据库连接
async function testDatabaseConnection() {
    try {
        const connection = await getDbConnection();
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log('✅ 数据库连接测试成功');
        return { success: true, message: '数据库连接正常', data: rows };
    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
        return { success: false, message: '数据库连接失败', error: error.message };
    }
}

// ==================== 路由处理器 ====================

// API 根路径
async function handleApiRoot(req, res) {
    sendJson(res, 200, {
        message: '元炁源流健康评估系统 API (简化版)',
        version: '2.0',
        status: '运行中',
        timestamp: new Date().toISOString()
    });
}

// 健康检查
async function handleHealth(req, res) {
    const dbStatus = await testDatabaseConnection();
    sendJson(res, 200, {
        service: 'health-assessment-api',
        status: 'running',
        database: dbStatus.success ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
}

// 用户登录
async function handleLogin(req, res) {
    try {
        const connection = await getDbConnection();
        const { username, password } = req.body;

        if (!username || !password) {
            return sendJson(res, 400, {
                code: 400,
                message: '用户名和密码不能为空'
            });
        }

        // 查询用户
        const [users] = await connection.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return sendJson(res, 401, {
                code: 401,
                message: '用户名或密码错误'
            });
        }

        const user = users[0];

        // 简单密码验证 (生产环境应使用 bcrypt)
        if (password !== user.password) {
            return sendJson(res, 401, {
                code: 401,
                message: '用户名或密码错误'
            });
        }

        // 生成简单 token
        const token = crypto.createHash('md5').update(`${user.id}-${Date.now()}`).digest('hex');

        sendJson(res, 200, {
            code: 200,
            message: '登录成功',
            data: {
                token: token,
                user: {
                    id: user.id,
                    username: user.username,
                    real_name: user.real_name,
                    role: user.role
                }
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        sendJson(res, 500, {
            code: 500,
            message: '服务器错误',
            error: error.message
        });
    }
}

// 获取所有评估记录
async function handleGetAssessments(req, res) {
    try {
        const connection = await getDbConnection();

        const [assessments] = await connection.execute(`
            SELECT
                id,
                assessment_code,
                real_name,
                age,
                gender,
                total_symptoms,
                total_score,
                avg_score,
                created_at
            FROM health_assessments
            ORDER BY created_at DESC
        `);

        sendJson(res, 200, {
            code: 200,
            message: '获取成功',
            data: {
                total: assessments.length,
                list: assessments
            }
        });
    } catch (error) {
        console.error('获取评估记录错误:', error);
        sendJson(res, 500, {
            code: 500,
            message: '服务器错误',
            error: error.message
        });
    }
}

// 创建新评估
async function handleCreateAssessment(req, res) {
    try {
        const connection = await getDbConnection();

        const { real_name, age, gender, symptoms, notes } = req.body;

        // 验证必填字段
        if (!real_name || !age || !gender) {
            return sendJson(res, 400, {
                code: 400,
                message: '缺少必填字段'
            });
        }

        if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
            return sendJson(res, 400, {
                code: 400,
                message: '至少选择一个症状'
            });
        }

        await connection.beginTransaction();

        try {
            // 生成评估编号
            const assessmentCode = `YA${new Date().toISOString().slice(0,10).replace(/-/g,'')}${String(Math.floor(Math.random() * 10000)).padStart(4,'0')}`;

            // 计算统计信息
            const totalSymptoms = symptoms.length;
            const totalScore = symptoms.reduce((sum, s) => sum + (s.intensity || 0), 0);
            const avgScore = totalSymptoms > 0 ? (totalScore / totalSymptoms).toFixed(2) : 0;

            // 插入评估记录
            const [result] = await connection.execute(`
                INSERT INTO health_assessments (
                    assessment_code, real_name, age, gender,
                    total_symptoms, total_score, avg_score,
                    notes, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `, [
                assessmentCode, real_name, age, gender,
                totalSymptoms, totalScore, avgScore,
                notes || ''
            ]);

            const assessmentId = result.insertId;

            // 插入症状详情
            for (const symptom of symptoms) {
                await connection.execute(`
                    INSERT INTO assessment_symptoms (
                        assessment_id, symptom_name, intensity, severity_level
                    ) VALUES (?, ?, ?, ?)
                `, [
                    assessmentId,
                    symptom.name,
                    symptom.intensity || 0,
                    symptom.severity_level || '轻度'
                ]);
            }

            await connection.commit();

            sendJson(res, 200, {
                code: 200,
                message: '评估记录创建成功',
                data: {
                    id: assessmentId,
                    assessment_code: assessmentCode,
                    total_symptoms: totalSymptoms,
                    total_score: totalScore,
                    avg_score: avgScore
                }
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    } catch (error) {
        console.error('创建评估错误:', error);
        sendJson(res, 500, {
            code: 500,
            message: '服务器错误',
            error: error.message
        });
    }
}

// 获取症状列表
async function handleGetSymptoms(req, res) {
    try {
        // 读取症状数据文件
        const symptomsDataPath = path.join(__dirname, 'symptoms_299_complete.json');
        const symptomsData = JSON.parse(fs.readFileSync(symptomsDataPath, 'utf8'));

        sendJson(res, 200, {
            code: 200,
            message: '获取成功',
            data: {
                total: symptomsData.length,
                list: symptomsData
            }
        });
    } catch (error) {
        console.error('获取症状列表错误:', error);
        sendJson(res, 500, {
            code: 500,
            message: '服务器错误',
            error: error.message
        });
    }
}

// ==================== 请求路由 ====================

const routes = {
    'GET /': handleApiRoot,
    'GET /api/health': handleHealth,
    'GET /api/assessments': handleGetAssessments,
    'POST /api/login': handleLogin,
    'POST /api/assessments': handleCreateAssessment,
    'GET /api/symptoms': handleGetSymptoms
};

async function handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;
    const pathname = parsedUrl.pathname;
    const routeKey = `${method} ${pathname}`;

    // 设置 CORS
    setCorsHeaders(res);

    // 处理 OPTIONS 预检请求
    if (method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    console.log(`${new Date().toISOString()} - ${method} ${pathname}`);

    // 查找路由处理器
    const handler = routes[routeKey];

    if (handler) {
        // 如果是 POST/PUT 请求，解析请求体
        if (method === 'POST' || method === 'PUT') {
            parseBody(req, (err, body) => {
                if (err) {
                    sendJson(res, 400, {
                        code: 400,
                        message: '请求数据格式错误'
                    });
                    return;
                }
                req.body = body;
                handler(req, res);
            });
        } else {
            handler(req, res);
        }
    } else {
        // 静态文件服务
        const filePath = path.join(__dirname, pathname === '/' ? 'health_assessment_backend_complete.html' : pathname);

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath);
            const contentTypes = {
                '.html': 'text/html',
                '.css': 'text/css',
                '.js': 'application/javascript',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.svg': 'image/svg+xml'
            };

            res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
            fs.createReadStream(filePath).pipe(res);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 - 页面未找到');
        }
    }
}

// ==================== 服务器启动 ====================

const server = http.createServer(handleRequest);

server.listen(PORT, async () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                  元炁源流健康评估系统                        ║
║                简化版后端服务器启动成功                       ║
╠══════════════════════════════════════════════════════════════╣
║  服务地址: http://localhost:${PORT}                           ║
║  版本: 2.0 (零依赖版本)                                        ║
║  数据库: ${DB_CONFIG.host}:${DB_CONFIG.port}                  ║
╚══════════════════════════════════════════════════════════════╝
    `);

    // 测试数据库连接
    await testDatabaseConnection();
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`错误: 端口 ${PORT} 已被占用，请检查是否有其他服务正在运行`);
    } else {
        console.error('服务器启动失败:', error);
    }
});

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('\n正在关闭服务器...');
    if (dbConnection) {
        await dbConnection.end();
    }
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});
