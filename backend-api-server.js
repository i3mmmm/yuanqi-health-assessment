// 元炁源流健康评估系统 - 后端API服务
// 版本: 1.0.0
// 技术栈: Node.js + Express + MySQL

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const puppeteer = require('puppeteer');

// 初始化Express应用
const app = express();
const port = process.env.PORT || 3000;  

// 配置CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

// 解析JSON请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务（用于访问上传的文件）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('只允许上传图片和PDF文件！'));
        }
    }
});

// 数据库连接池配置
const dbPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'yuanqi_health',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 健康分析引擎类
class HealthAnalysisEngine {
    constructor(dbPool) {
        this.db = dbPool;
    }

    // 主分析函数
    async analyzeAssessment(assessmentId) {
        try {
            // 获取评估的所有症状
            const [symptoms] = await this.db.execute(
                'SELECT * FROM assessment_symptoms WHERE assessment_id = ?',
                [assessmentId]
            );

            if (symptoms.length === 0) {
                throw new Error('未找到症状数据');
            }

            // 1. 计算病因分析
            const causeAnalysis = await this.analyzeCauses(symptoms);

            // 2. 计算脏腑分析
            const organAnalysis = await this.analyzeOrgans(symptoms);

            // 3. 计算体质分析
            const constitutionAnalysis = this.analyzeConstitution(symptoms);

            // 4. 计算注意事项和禁忌
            const precautionsAndTaboos = await this.analyzePrecautionsAndTaboos(symptoms);

            // 5. 计算情绪状态
            const emotionAnalysis = await this.analyzeEmotions(symptoms);

            // 6. 计算健康趋势
            const healthTrends = await this.analyzeTrends(symptoms);

            // 7. 计算生活习惯
            const lifestyleHabits = await this.analyzeLifestyle(symptoms);

            // 8. 计算营养缺乏
            const nutrientDeficiency = await this.analyzeNutrients(symptoms);

            // 9. 计算总体健康评分
            const overallHealth = await this.calculateOverallHealth(
                causeAnalysis,
                organAnalysis,
                constitutionAnalysis
            );

            // 10. 生成调理建议
            const recommendations = await this.generateRecommendations(
                causeAnalysis,
                organAnalysis,
                constitutionAnalysis,
                nutrientDeficiency
            );

            // 构建分析结果
            const analysisResult = {
                cause_analysis: causeAnalysis,
                organ_analysis: organAnalysis,
                constitution_analysis: constitutionAnalysis,
                precautions: precautionsAndTaboos.precautions,
                taboos: precautionsAndTaboos.taboos,
                emotion_analysis: emotionAnalysis,
                health_trends: healthTrends,
                lifestyle_habits: lifestyleHabits,
                mineral_deficiency: nutrientDeficiency.minerals,
                vitamin_deficiency: nutrientDeficiency.vitamins,
                overall_health_score: overallHealth.score,
                health_level: overallHealth.level,
                primary_issues: overallHealth.issues,
                recommendations: recommendations
            };

            return analysisResult;

        } catch (error) {
            console.error('分析评估失败:', error);
            throw error;
        }
    }

    // 病因分析
    async analyzeCauses(symptoms) {
        const causes = {
            '微循环': 0,
            '体质': 0,
            '毒素': 0,
            '习惯': 0,
            '营养': 0,
            '内分泌': 0,
            '免疫力': 0,
            '气血': 0
        };

        symptoms.forEach(symptom => {
            try {
                const causeLabels = JSON.parse(symptom.cause_labels);
                causeLabels.forEach(label => {
                    if (causes.hasOwnProperty(label)) {
                        causes[label] += symptom.intensity;
                    }
                });
            } catch (e) {
                console.warn('解析cause_labels失败:', e);
            }
        });

        return causes;
    }

    // 脏腑分析
    async analyzeOrgans(symptoms) {
        const organs = {
            '肝': 0,
            '胃': 0,
            '肾': 0,
            '脾': 0,
            '综合': 0
        };

        for (const symptom of symptoms) {
            try {
                const [symptomDetails] = await this.db.execute(
                    'SELECT organ FROM symptom_library WHERE id = ?',
                    [symptom.symptom_id]
                );

                if (symptomDetails.length > 0 && symptomDetails[0].organ) {
                    const organNames = symptomDetails[0].organ.split('、');
                    organNames.forEach(organ => {
                        if (organs.hasOwnProperty(organ)) {
                            organs[organ] += symptom.intensity;
                        } else {
                            organs['综合'] += symptom.intensity;
                        }
                    });
                } else {
                    organs['综合'] += symptom.intensity;
                }
            } catch (e) {
                console.warn('获取症状详情失败:', e);
                organs['综合'] += symptom.intensity;
            }
        }

        return organs;
    }

    // 体质分析
    async analyzeConstitution(symptoms) {
        const constitutions = {
            '血虚': 0,
            '寒凉': 0,
            '气虚': 0,
            '阳虚': 0,
            '阴虚': 0,
            '血瘀': 0,
            '气郁': 0,
            '湿热': 0,
            '痰湿': 0
        };

        for (const symptom of symptoms) {
            try {
                const [symptomDetails] = await this.db.execute(
                    'SELECT causes FROM symptom_library WHERE id = ?',
                    [symptom.symptom_id]
                );

                if (symptomDetails.length > 0) {
                    try {
                        const causes = JSON.parse(symptomDetails[0].causes);
                        causes.forEach(cause => {
                            const constitutionType = this.mapCauseToConstitution(cause.label);
                            if (constitutions.hasOwnProperty(constitutionType)) {
                                constitutions[constitutionType] += Math.floor(symptom.intensity * 0.5);
                            }
                        });
                    } catch (e) {
                        console.warn('解析causes失败:', e);
                    }
                }
            } catch (e) {
                console.warn('获取症状详情失败:', e);
            }
        }

        return constitutions;
    }

    // 注意事项和禁忌分析
    async analyzePrecautionsAndTaboos(symptoms) {
        const precautions = {};
        const taboos = {};

        for (const symptom of symptoms) {
            try {
                const [symptomDetails] = await this.db.execute(
                    'SELECT warnings, taboos FROM symptom_library WHERE id = ?',
                    [symptom.symptom_id]
                );

                if (symptomDetails.length > 0) {
                    try {
                        const warnings = JSON.parse(symptomDetails[0].warnings || '[]');
                        const symptomTaboos = JSON.parse(symptomDetails[0].taboos || '[]');

                        warnings.forEach(warning => {
                            precautions[warning] = (precautions[warning] || 0) + symptom.intensity;
                        });

                        symptomTaboos.forEach(taboo => {
                            taboos[taboo] = (taboos[taboo] || 0) + symptom.intensity;
                        });
                    } catch (e) {
                        console.warn('解析warnings/tabos失败:', e);
                    }
                }
            } catch (e) {
                console.warn('获取症状详情失败:', e);
            }
        }

        // 只保留强度较高的前10项
        const sortedPrecautions = Object.entries(precautions)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});

        const sortedTaboos = Object.entries(taboos)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});

        return { precautions: sortedPrecautions, taboos: sortedTaboos };
    }

    // 情绪状态分析
    analyzeEmotions(symptoms) {
        const emotions = {
            '怒': 0,
            '压力过大': 0,
            '思': 0,
            '抑郁': 0,
            '紧张': 0,
            '心情不好': 0,
            '哀': 0,
            '焦虑': 0,
            '激动': 0,
            '恐': 0,
            '情志失调': 0,
            '惊': 0,
            '精神': 0
        };

        // 基于症状关联的情绪状态
        symptoms.forEach(symptom => {
            try {
                const causeLabels = JSON.parse(symptom.cause_labels);
                causeLabels.forEach(label => {
                    if (label === '内分泌' || label === '毒素') {
                        emotions['压力过大'] += Math.floor(symptom.intensity * 0.3);
                        emotions['焦虑'] += Math.floor(symptom.intensity * 0.2);
                    }
                    if (label === '习惯' || label === '微循环') {
                        emotions['紧张'] += Math.floor(symptom.intensity * 0.2);
                    }
                });
            } catch (e) {
                console.warn('解析cause_labels失败:', e);
            }
        });

        return emotions;
    }

    // 健康趋势分析
    analyzeTrends(symptoms) {
        const trends = {
            '外伤': 0,
            '遗传': 0,
            '高血压': 0,
            '失眠': 0,
            '糖尿病': 0,
            '青光眼': 0,
            '感冒': 0,
            '颈椎病': 0,
            '肿瘤': 0,
            '甲亢': 0,
            '消化不良': 0,
            '营养不良': 0
        };

        // 基于症状名称和原因分析趋势
        symptoms.forEach(symptom => {
            const symptomName = symptom.symptom_name || '';
            const causeLabels = JSON.parse(symptom.cause_labels || '[]');

            if (symptomName.includes('头疼') || symptomName.includes('头晕')) {
                trends['高血压'] += Math.floor(symptom.intensity * 0.4);
                trends['颈椎病'] += Math.floor(symptom.intensity * 0.3);
            }

            if (symptomName.includes('失眠') || symptomName.includes('多梦')) {
                trends['失眠'] += symptom.intensity;
            }

            if (symptomName.includes('视力')) {
                trends['青光眼'] += Math.floor(symptom.intensity * 0.3);
            }

            if (causeLabels.includes('营养')) {
                trends['营养不良'] += Math.floor(symptom.intensity * 0.5);
            }

            if (causeLabels.includes('免疫力')) {
                trends['感冒'] += Math.floor(symptom.intensity * 0.4);
            }
        });

        return trends;
    }

    // 生活习惯分析
    analyzeLifestyle(symptoms) {
        const habits = {
            '熬夜': 0,
            '用眼过度': 0,
            '过劳': 0,
            '运动过少': 0,
            '贪凉': 0,
            '辐射': 0,
            '作息不规律': 0,
            '饮水过少': 0,
            '久坐': 0
        };

        symptoms.forEach(symptom => {
            try {
                const causeLabels = JSON.parse(symptom.cause_labels);
                const symptomName = symptom.symptom_name || '';

                if (symptomName.includes('眼') || symptomName.includes('视力')) {
                    habits['用眼过度'] += symptom.intensity;
                }

                if (symptomName.includes('失眠') || symptomName.includes('多梦')) {
                    habits['熬夜'] += symptom.intensity;
                }

                if (causeLabels.includes('习惯')) {
                    habits['作息不规律'] += Math.floor(symptom.intensity * 0.4);
                    habits['熬夜'] += Math.floor(symptom.intensity * 0.3);
                }

                if (causeLabels.includes('微循环') || causeLabels.includes('循环')) {
                    habits['运动过少'] += Math.floor(symptom.intensity * 0.3);
                    habits['久坐'] += Math.floor(symptom.intensity * 0.3);
                }
            } catch (e) {
                console.warn('解析cause_labels失败:', e);
            }
        });

        return habits;
    }

    // 营养缺乏分析
    async analyzeNutrients(symptoms) {
        const minerals = {
            '钙': 0,
            '锌': 0,
            '硒': 0,
            '镁': 0,
            '铬': 0,
            '锰': 0,
            '铁': 0,
            '磷': 0
        };

        const vitamins = {
            'A': 0,
            'C': 0,
            'E': 0,
            'B1': 0,
            'B2': 0,
            'B3': 0,
            'B5': 0,
            'B6': 0,
            'B7': 0,
            'B9': 0,
            'B12': 0,
            'B1_': 0,
            'D_': 0,
            'F': 0,
            'M': 0,
            'P': 0
        };

        for (const symptom of symptoms) {
            try {
                const [symptomDetails] = await this.db.execute(
                    'SELECT causes FROM symptom_library WHERE id = ?',
                    [symptom.symptom_id]
                );

                if (symptomDetails.length > 0) {
                    try {
                        const causes = JSON.parse(symptomDetails[0].causes);
                        causes.forEach(cause => {
                            if (cause.label === '营养') {
                                // 根据症状特征推断营养缺乏
                                if (symptom.symptom_name.includes('眼')) {
                                    minerals['锌'] += Math.floor(symptom.intensity * 0.4);
                                    vitamins['A'] += Math.floor(symptom.intensity * 0.5);
                                }

                                if (symptom.symptom_name.includes('脱发') || symptom.symptom_name.includes('白发')) {
                                    minerals['锌'] += Math.floor(symptom.intensity * 0.5);
                                    vitamins['E'] += Math.floor(symptom.intensity * 0.4);
                                    vitamins['B7'] += Math.floor(symptom.intensity * 0.3);
                                }

                                if (symptom.symptom_name.includes('贫血') || symptom.symptom_name.includes('苍白')) {
                                    minerals['铁'] += symptom.intensity;
                                    vitamins['B12'] += Math.floor(symptom.intensity * 0.5);
                                }

                                if (symptom.symptom_name.includes('骨质疏松') || symptom.symptom_name.includes('骨折')) {
                                    minerals['钙'] += symptom.intensity;
                                    minerals['镁'] += Math.floor(symptom.intensity * 0.6);
                                }

                                if (symptom.symptom_name.includes('免疫力') || symptom.symptom_name.includes('感染')) {
                                    vitamins['C'] += Math.floor(symptom.intensity * 0.6);
                                    minerals['锌'] += Math.floor(symptom.intensity * 0.5);
                                    minerals['硒'] += Math.floor(symptom.intensity * 0.4);
                                }

                                if (symptom.symptom_name.includes('皮肤') || symptom.symptom_name.includes('干燥')) {
                                    vitamins['A'] += Math.floor(symptom.intensity * 0.5);
                                    vitamins['E'] += Math.floor(symptom.intensity * 0.4);
                                }
                            }
                        });
                    } catch (e) {
                        console.warn('解析causes失败:', e);
                    }
                }
            } catch (e) {
                console.warn('获取症状详情失败:', e);
            }
        }

        return { minerals, vitamins };
    }

    // 计算总体健康评分
    async calculateOverallHealth(causeAnalysis, organAnalysis, constitutionAnalysis) {
        // 1. 基于病因分析计算基础分
        const maxPossibleScore = 20 * 8; // 假设每个病因最大分20，共8个病因
        const actualScore = Object.values(causeAnalysis).reduce((a, b) => a + b, 0);
        const causeScore = 100 - (actualScore / maxPossibleScore * 100);

        // 2. 基于脏腑分析调整
        const organScore = Math.max(0, 100 - (Object.values(organAnalysis).reduce((a, b) => a + b, 0) / 100 * 50));

        // 3. 基于体质分析调整
        const constitutionScore = Math.max(0, 100 - (Object.values(constitutionAnalysis).reduce((a, b) => a + b, 0) / 100 * 30));

        // 综合评分
        const overallScore = (causeScore * 0.5 + organScore * 0.3 + constitutionScore * 0.2).toFixed(2);

        // 确定健康等级
        let healthLevel;
        if (overallScore >= 80) healthLevel = 'excellent';
        else if (overallScore >= 60) healthLevel = 'good';
        else if (overallScore >= 40) healthLevel = 'fair';
        else healthLevel = 'poor';

        // 识别主要问题
        const primaryIssues = [];
        Object.entries(causeAnalysis)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .forEach(([cause, score]) => {
                if (score > 10) {
                    primaryIssues.push({
                        type: 'cause',
                        name: cause,
                        score: score
                    });
                }
            });

        return {
            score: parseFloat(overallScore),
            level: healthLevel,
            issues: primaryIssues
        };
    }

    // 生成调理建议
    async generateRecommendations(causeAnalysis, organAnalysis, constitutionAnalysis, nutrientDeficiency) {
        const recommendations = [];

        // 1. 基于病因分析的建议
        const topCauses = Object.entries(causeAnalysis)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2);

        topCauses.forEach(([cause, score]) => {
            if (cause === '微循环' && score > 15) {
                recommendations.push('建议进行适量有氧运动，如散步、太极，改善血液循环。');
            } else if (cause === '毒素' && score > 15) {
                recommendations.push('建议增加饮水量，多食用排毒食物如绿豆、海带。');
            } else if (cause === '习惯' && score > 15) {
                recommendations.push('建议调整作息，避免熬夜，保持规律生活。');
            }
        });

        // 2. 基于脏腑分析的建议
        const topOrgans = Object.entries(organAnalysis)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2);

        topOrgans.forEach(([organ, score]) => {
            if (organ === '肝' && score > 10) {
                recommendations.push('肝功能偏弱，建议少熬夜，避免生气，多食用绿色蔬菜。');
            } else if (organ === '肾' && score > 10) {
                recommendations.push('肾气不足，建议节制房事，多食用黑色食物如黑豆、芝麻。');
            } else if (organ === '脾' && score > 10) {
                recommendations.push('脾胃虚弱，建议少食生冷，多食用山药、小米等健脾食物。');
            } else if (organ === '胃' && score > 10) {
                recommendations.push('胃部功能较弱，建议少食生冷油腻，规律饮食。');
            }
        });

        // 3. 基于体质分析的建议
        const topConstitutions = Object.entries(constitutionAnalysis)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2);

        topConstitutions.forEach(([constitution, score]) => {
            if (constitution === '血虚' && score > 10) {
                recommendations.push('血虚体质，建议多食用红枣、桂圆、菠菜等补血食物。');
            } else if (constitution === '寒凉' && score > 10) {
                recommendations.push('寒凉体质，建议多食温热食物，如生姜、羊肉，注意保暖。');
            } else if (constitution === '气虚' && score > 10) {
                recommendations.push('气虚体质，建议多食山药、莲子、黄芪等补气食物。');
            } else if (constitution === '阳虚' && score > 10) {
                recommendations.push('阳虚体质，建议注意保暖，避免生冷，多食温热食物。');
            } else if (constitution === '阴虚' && score > 10) {
                recommendations.push('阴虚体质，建议多食用滋阴食物，如银耳、百合、枸杞。');
            }
        });

        // 4. 基于营养缺乏的建议
        const topMinerals = Object.entries(nutrientDeficiency.minerals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        topMinerals.forEach(([mineral, score]) => {
            if (mineral === '钙') {
                recommendations.push('缺钙，建议多食用牛奶、豆制品、深色蔬菜。');
            } else if (mineral === '锌') {
                recommendations.push('缺锌，建议多食用牡蛎、牛肉、坚果。');
            } else if (mineral === '硒') {
                recommendations.push('缺硒，建议多食用海鱼、鸡蛋、大蒜。');
            } else if (mineral === '铁') {
                recommendations.push('缺铁，建议多食用瘦肉、菠菜、动物肝脏。');
            } else if (mineral === '镁') {
                recommendations.push('缺镁，建议多食用深绿色蔬菜、坚果、全谷物。');
            }
        });

        const topVitamins = Object.entries(nutrientDeficiency.vitamins)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        topVitamins.forEach(([vitamin, score]) => {
            if (vitamin === 'A') {
                recommendations.push('维生素A缺乏，建议多食用胡萝卜、动物肝脏、蛋黄。');
            } else if (vitamin === 'C') {
                recommendations.push('维生素C缺乏，建议多食用柑橘、猕猴桃、青椒。');
            } else if (vitamin === 'E') {
                recommendations.push('维生素E缺乏，建议多食用坚果、植物油、绿叶蔬菜。');
            } else if (vitamin.startsWith('B')) {
                recommendations.push('B族维生素缺乏，建议多食用全谷物、瘦肉、蛋类。');
            }
        });

        return recommendations.length > 0 ? recommendations.join('\n') : '整体健康状况良好，保持健康的生活方式即可。';
    }

    // 辅助函数：映射病因到体质
    mapCauseToConstitution(causeLabel) {
        const mapping = {
            '微循环': '血瘀',
            '毒素': '湿热',
            '体质': '气虚',
            '习惯': '气虚',
            '营养': '血虚',
            '内分泌': '气郁',
            '免疫力': '阳虚',
            '气血': '气血',
            '循环': '血瘀'
        };
        return mapping[causeLabel] || '气虚';
    }
}

// 创建分析引擎实例
const analysisEngine = new HealthAnalysisEngine(dbPool);

// JWT中间件
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ code: 401, message: '未提供认证令牌' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ code: 403, message: '无效的认证令牌' });
        }
        req.user = user;
        next();
    });
}

// 管理员权限中间件
async function requireAdmin(req, res, next) {
    try {
        const [users] = await dbPool.execute(
            'SELECT role FROM users WHERE id = ?',
            [req.user.userId]
        );

        if (users.length === 0 || users[0].role !== 'admin') {
            return res.status(403).json({ code: 403, message: '需要管理员权限' });
        }

        next();
    } catch (error) {
        return res.status(500).json({ code: 500, message: '权限验证失败' });
    }
}

// 调理师权限中间件
async function requirePractitioner(req, res, next) {
    try {
        const [users] = await dbPool.execute(
            'SELECT role FROM users WHERE id = ?',
            [req.user.userId]
        );

        if (users.length === 0 || (users[0].role !== 'admin' && users[0].role !== 'practitioner')) {
            return res.status(403).json({ code: 403, message: '需要调理师权限' });
        }

        next();
    } catch (error) {
        return res.status(500).json({ code: 500, message: '权限验证失败' });
    }
}

// ==================== API路由 ====================

// 1. 用户认证API

// 用户注册
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, real_name, phone, email, role = 'customer' } = req.body;

        // 验证必填字段
        if (!username || !password) {
            return res.status(400).json({ code: 400, message: '用户名和密码为必填项' });
        }

        // 检查用户名是否已存在
        const [existingUsers] = await dbPool.execute(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ code: 400, message: '用户名已存在' });
        }

        // 检查手机号是否已存在
        if (phone) {
            const [existingPhones] = await dbPool.execute(
                'SELECT id FROM users WHERE phone = ?',
                [phone]
            );

            if (existingPhones.length > 0) {
                return res.status(400).json({ code: 400, message: '手机号已被注册' });
            }
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 插入新用户
        const [result] = await dbPool.execute(
            'INSERT INTO users (username, password_hash, real_name, phone, email, role) VALUES (?, ?, ?, ?, ?, ?)',
            [username, hashedPassword, real_name, phone, email, role]
        );

        // 生成JWT令牌
        const token = jwt.sign(
            { userId: result.insertId, username: username, role: role },
            JWT_SECRET,
            { expiresIn: '86400s' } // 24小时
        );

        res.json({
            code: 200,
            message: '注册成功',
            data: {
                user_id: result.insertId,
                username: username,
                real_name: real_name,
                role: role,
                token: token
            }
        });

    } catch (error) {
        console.error('注册失败:', error);
        res.status(500).json({ code: 500, message: '注册失败: ' + error.message });
    }
});

// 用户登录
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ code: 400, message: '用户名和密码为必填项' });
        }

        // 查询用户
        const [users] = await dbPool.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ code: 401, message: '用户名或密码错误' });
        }

        const user = users[0];

        // 验证密码
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ code: 401, message: '用户名或密码错误' });
        }

        // 检查账户状态
        if (user.status !== 'active') {
            return res.status(403). json({ code: 403, message: '账户已被禁用' });
        }

        // 更新最后登录时间
        await dbPool.execute(
            'UPDATE users SET last_login_at = NOW() WHERE id = ?',
            [user.id]
        );

        // 生成JWT令牌
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '86400s' } // 24小时
        );

        res.json({
            code: 200,
            message: '登录成功',
            data: {
                user_id: user.id,
                username: user.username,
                real_name: user.real_name,
                phone: user.phone,
                email: user.email,
                role: user.role,
                avatar_url: user.avatar_url,
                token: token,
                expires_in: 86400
            }
        });

    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({ code: 500, message: '登录失败: ' + error.message });
    }
});

// 2. 评估数据API

// 创建新评估
app.post('/api/assessments', async (req, res) => {
    const connection = await dbPool.getConnection();

    try {
        const {
            user_id,
            real_name,
            age,
            gender,
            height,
            weight,
            waist_circumference,
            blood_sugar,
            systolic_pressure,
            diastolic_pressure,
            remarks,
            symptoms
        } = req.body;

        // 验证必填字段
        if (!user_id || !real_name || !age || !gender) {
            return res.status(400).json({ code: 400, message: '缺少必填字段' });
        }

        if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
            return res.status(400).json({ code: 400, message: '至少选择一个症状' });
        }

        await connection.beginTransaction();

        // 生成评估编号
        const assessmentCode = `YA${new Date().toISOString().slice(0,10).replace(/-/g,'')}${String(Math.floor(Math.random() * 10000)).padStart(4,'0')}`;

        // 计算统计信息
        const totalSymptoms = symptoms.length;
        const totalScore = symptoms.reduce((sum, s) => sum + (s.intensity || 0), 0);
        const avgScore = totalSymptoms > 0 ? (totalScore / totalSymptoms).toFixed(2) : 0;

        // 插入评估记录
        const [assessmentResult] = await connection.execute(
            `INSERT INTO assessments (
                user_id, assessment_code, assessment_date, real_name, age, gender,
                height, weight, waist_circumference, blood_sugar, systolic_pressure, diastolic_pressure,
                remarks, total_symptoms, total_score, avg_score, status
            ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                user_id,
                assessmentCode,
                real_name,
                age,
                gender,
                height || null,
                weight || null,
                waist_circumference || null,
                blood_sugar || null,
                systolic_pressure || null,
                diastolic_pressure || null,
                remarks || null,
                totalSymptoms,
                totalScore,
                avgScore,
                'draft'
            ]
        );

        const assessmentId = assessmentResult.insertId;

        // 插入症状详情
        for (const symptom of symptoms) {
            const severity = symptom.intensity <= 6 ? 'mild' : (symptom.intensity <= 13 ? 'moderate' : 'severe');
            const side = symptom.side === '左侧' ? 'left' : (symptom.side === '右侧' ? 'right' : 'both');

            await connection.execute(
                `INSERT INTO assessment_symptoms (
                    assessment_id, symptom_id, symptom_name, side, intensity, severity, cause_labels
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    assessmentId,
                    symptom.symptom_id || null,
                    symptom.symptom_name,
                    side,
                    symptom.intensity,
                    severity,
                    JSON.stringify(symptom.cause_labels || [])
                ]
            );
        }

        // 自动分析评估
        const analysisResult = await analysisEngine.analyzeAssessment(assessmentId);

        // 插入分析结果
        await connection.execute(
            `INSERT INTO analysis_results (
                assessment_id, cause_analysis, organ_analysis, constitution_analysis,
                precautions, taboos, emotion_analysis, health_trends, lifestyle_habits,
                mineral_deficiency, vitamin_deficiency, overall_health_score, health_level,
                primary_issues, recommendations
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                assessmentId,
                JSON.stringify(analysisResult.cause_analysis),
                JSON.stringify(analysisResult.organ_analysis),
                JSON.stringify(analysisResult.constitution_analysis),
                JSON.stringify(analysisResult.precautions),
                JSON.stringify(analysisResult.taboos),
                JSON.stringify(analysisResult.emotion_analysis),
                JSON.stringify(analysisResult.health_trends),
                JSON.stringify(analysisResult.lifestyle_habits),
                JSON.stringify(analysisResult.mineral_deficiency),
                JSON.stringify(analysisResult.vitamin_deficiency),
                analysisResult.overall_health_score,
                analysisResult.health_level,
                JSON.stringify(analysisResult.primary_issues),
                analysisResult.recommendations
            ]
        );

        // 更新评估状态为已分析
        await connection.execute(
            'UPDATE assessments SET status = "analyzed" WHERE id = ?',
            [assessmentId]
        );

        await connection.commit();

        res.json({
            code: 200,
            message: '评估创建成功',
            data: {
                assessment_id: assessmentId,
                assessment_code: assessmentCode,
                assessment_date: new Date().toISOString(),
                status: 'analyzed'
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('创建评估失败:', error);
        res.status(500).json({ code: 500, message: '创建评估失败: ' + error.message });
    } finally {
        connection.release();
    }
});

// 获取评估详情
app.get('/api/assessments/:assessment_id', async (req, res) => {
    try {
        const assessmentId = req.params.assessment_id;

        // 获取评估记录
        const [assessments] = await dbPool.execute(
            'SELECT * FROM assessments WHERE id = ?',
            [assessmentId]
        );

        if (assessments.length === 0) {
            return res.status(404).json({ code: 404, message: '评估记录不存在' });
        }

        const assessment = assessments[0];

        // 获取症状详情
        const [symptoms] = await dbPool.execute(
            'SELECT * FROM assessment_symptoms WHERE assessment_id = ?',
            [assessmentId]
        );

        // 获取分析结果
        const [analyses] = await dbPool.execute(
            'SELECT * FROM analysis_results WHERE assessment_id = ?',
            [assessmentId]
        );

        // 解析JSON字段
        const parsedSymptoms = symptoms.map(s => ({
            ...s,
            cause_labels: JSON.parse(s.cause_labels || '[]')
        }));

        const parsedAnalysis = analyses.length > 0 ? {
            ...analyses[0],
            cause_analysis: JSON.parse(analyses[0].cause_analysis || '{}'),
            organ_analysis: JSON.parse(analyses[0].organ_analysis || '{}'),
            constitution_analysis: JSON.parse(analyses[0].constitution_analysis || '{}'),
            precautions: JSON.parse(analyses[0].precautions || '{}'),
            taboos: JSON.parse(analyses[0].taboos || '{}'),
            emotion_analysis: JSON.parse(analyses[0].emotion_analysis || '{}'),
            health_trends: JSON.parse(analyses[0].health_trends || '{}'),
            lifestyle_habits: JSON.parse(analyses[0].lifestyle_habits || '{}'),
            mineral_deficiency: JSON.parse(analyses[0].mineral_deficiency || '{}'),
            vitamin_deficiency: JSON.parse(analyses[0].vitamin_deficiency || '{}'),
            primary_issues: JSON.parse(analyses[0].primary_issues || '[]')
        } : null;

        res.json({
            code: 200,
            message: '获取成功',
            data: {
                assessment: {
                    id: assessment.id,
                    assessment_code: assessment.assessment_code,
                    real_name: assessment.real_name,
                    age: assessment.age,
                    gender: assessment.gender,
                    height: assessment.height,
                    weight: assessment.weight,
                    waist_circumference: assessment.waist_circumference,
                    blood_sugar: assessment.blood_sugar,
                    systolic_pressure: assessment.systolic_pressure,
                    diastolic_pressure: assessment.diastolic_pressure,
                    remarks: assessment.remarks,
                    total_symptoms: assessment.total_symptoms,
                    total_score: assessment.total_score,
                    avg_score: assessment.avg_score,
                    status: assessment.status,
                    assessment_date: assessment.assessment_date
                },
                symptoms: parsedSymptoms,
                analysis: parsedAnalysis
            }
        });

    } catch (error) {
        console.error('获取评估详情失败:', error);
        res.status(500).json({ code: 500, message: '获取评估详情失败: ' + error.message });
    }
});

// 获取用户评估列表
app.get('/api/assessments', async (req, res) => {
    try {
        const { user_id, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM assessments';
        let countQuery = 'SELECT COUNT(*) as total FROM assessments';
        let params = [];
        let countParams = [];

        if (user_id) {
            query += ' WHERE user_id = ?';
            countQuery += ' WHERE user_id = ?';
            params.push(user_id);
            countParams.push(user_id);
        }

        query += ' ORDER BY assessment_date DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [assessments] = await dbPool.execute(query, params);
        const [countResult] = await dbPool.execute(countQuery, countParams);

        const total = countResult[0].total;

        res.json({
            code: 200,
            message: '获取成功',
            data: {
                total: total,
                page: parseInt(page),
                limit: parseInt(limit),
                assessments: assessments
            }
        });

    } catch (error) {
        console.error('获取评估列表失败:', error);
        res.status(500).json({ code: 500, message: '获取评估列表失败: ' + error.message });
    }
});

// 3. 症状库API

// 获取症状库
app.get('/api/symptoms', async (req, res) => {
    try {
        const { page = 1, limit = 50, organ, search } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM symptom_library WHERE is_active = true';
        let countQuery = 'SELECT COUNT(*) as total FROM symptom_library WHERE is_active = true';
        let params = [];
        let countParams = [];

        if (organ) {
            query += ' AND organ LIKE ?';
            countQuery += ' AND organ LIKE ?';
            const organPattern = `%${organ}%`;
            params.push(organPattern);
            countParams.push(organPattern);
        }

        if (search) {
            query += ' AND (name LIKE ? OR organ LIKE ?)';
            countQuery += ' AND (name LIKE ? OR organ LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern);
            countParams.push(searchPattern, searchPattern);
        }

        query += ' ORDER BY id LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [symptoms] = await dbPool.execute(query, params);
        const [countResult] = await dbPool.execute(countQuery, countParams);

        // 解析JSON字段
        const parsedSymptoms = symptoms.map(s => ({
            ...s,
            causes: JSON.parse(s.causes || '[]'),
            warnings: JSON.parse(s.warnings || '[]'),
            taboos: JSON.parse(s.taboos || '[]')
        }));

        const total = countResult[0].total;

        res.json({
            code: 200,
            message: '获取成功',
            data: {
                total: total,
                page: parseInt(page),
                limit: parseInt(limit),
                symptoms: parsedSymptoms
            }
        });

    } catch (error) {
        console.error('获取症状库失败:', error);
        res.status(500).json({ code: 500, message: '获取症状库失败: ' + error.message });
    }
});

// 4. 评估对比API

// 评估对比分析
app.post('/api/assessments/compare', async (req, res) => {
    try {
        const { assessment_ids } = req.body;

        if (!assessment_ids || !Array.isArray(assessment_ids) || assessment_ids.length < 2) {
            return res.status(400).json({ code: 400, message: '至少需要两个评估ID进行对比' });
        }

        if (assessment_ids.length > 2) {
            return res.status(400).json({ code: 400, message: '最多支持两个评估对比' });
        }

        const [assessment1] = await dbPool.execute(
            'SELECT * FROM assessments WHERE id = ?',
            [assessment_ids[0]]
        );

        const [assessment2] = await dbPool.execute(
            'SELECT * FROM assessments WHERE id = ?',
            [assessment_ids[1]]
        );

        if (assessment1.length === 0 || assessment2.length === 0) {
            return res.status(404).json({ code: 404, message: '评估记录不存在' });
        }

        // 获取两个评估的症状
        const [symptoms1] = await dbPool.execute(
            'SELECT * FROM assessment_symptoms WHERE assessment_id = ?',
            [assessment_ids[0]]
        );

        const [symptoms2] = await dbPool.execute(
            'SELECT * FROM assessment_symptoms WHERE assessment_id = ?',
            [assessment_ids[1]]
        );

        // 分析症状变化
        const symptomChanges = {
            improved: [],
            worsened: [],
            new: [],
            resolved: []
        };

        // 创建症状映射
        const symptomMap1 = new Map();
        symptoms1.forEach(s => {
            symptomMap1.set(s.symptom_name, s.intensity);
        });

        const symptomMap2 = new Map();
        symptoms2.forEach(s => {
            symptomMap2.set(s.symptom_name, s.intensity);
        });

        // 对比症状
        symptomMap1.forEach((intensity1, name) => {
            if (symptomMap2.has(name)) {
                const intensity2 = symptomMap2.get(name);
                if (intensity2 < intensity1) {
                    symptomChanges.improved.push({
                        name: name,
                        before: intensity1,
                        after: intensity2,
                        change: intensity2 - intensity1
                    });
                } else if (intensity2 > intensity1) {
                    symptomChanges.worsened.push({
                        name: name,
                        before: intensity1,
                        after: intensity2,
                        change: intensity2 - intensity1
                    });
                }
            } else {
                symptomChanges.resolved.push({
                    name: name,
                    intensity: intensity1
                });
            }
        });

        symptomMap2.forEach((intensity2, name) => {
            if (!symptomMap1.has(name)) {
                symptomChanges.new.push({
                    name: name,
                    intensity: intensity2
                });
            }
        });

        // 计算评分变化
        const scoreChanges = {
            total_score: {
                before: assessment1[0].total_score,
                after: assessment2[0].total_score,
                change: assessment2[0].total_score - assessment1[0].total_score,
                percentage: ((assessment2[0].total_score - assessment1[0].total_score) / assessment1[0].total_score * 100).toFixed(2)
            },
            avg_score: {
                before: assessment1[0].avg_score,
                after: assessment2[0].avg_score,
                change: (assessment2[0].avg_score - assessment1[0].avg_score).toFixed(2)
            }
        };

        // 判断健康趋势
        let healthTrend = 'stable';
        if (scoreChanges.total_score.change < -10) {
            healthTrend = 'improving';
        } else if (scoreChanges.total_score.change > 10) {
            healthTrend = 'worsening';
        }

        res.json({
            code: 200,
            message: '对比分析成功',
            data: {
                comparison: {
                    assessment_a: {
                        id: assessment1[0].id,
                        assessment_code: assessment1[0].assessment_code,
                        assessment_date: assessment1[0].assessment_date,
                        total_score: assessment1[0].total_score,
                        avg_score: assessment1[0].avg_score
                    },
                    assessment_b: {
                        id: assessment2[0].id,
                        assessment_code: assessment2[0].assessment_code,
                        assessment_date: assessment2[0].assessment_date,
                        total_score: assessment2[0].total_score,
                        avg_score: assessment2[0].avg_score
                    },
                    symptom_changes: symptomChanges,
                    score_changes: scoreChanges,
                    health_trend: healthTrend
                }
            }
        });

    } catch (error) {
        console.error('对比分析失败:', error);
        res.status(500).json({ code: 500, message: '对比分析失败: ' + error.message });
    }
});

// 5. 报告生成API

// 生成PDF报告
app.post('/api/reports/generate', async (req, res) => {
    try {
        const { assessment_id, report_type = 'assessment' } = req.body;

        if (!assessment_id) {
            return res.status(400).json({ code: 400, message: '缺少评估ID' });
        }

        // 获取评估详情
        const [assessments] = await dbPool.execute(
            'SELECT * FROM assessments WHERE id = ?',
            [assessment_id]
        );

        if (assessments.length === 0) {
            return res.status(404).json({ code: 404, message: '评估记录不存在' });
        }

        const assessment = assessments[0];

        // 获取分析结果
        const [analyses] = await dbPool.execute(
            'SELECT * FROM analysis_results WHERE assessment_id = ?',
            [assessment_id]
        );

        if (analyses.length === 0) {
            return res.status(404).json({ code: 404, message: '分析结果不存在' });
        }

        const analysis = analyses[0];

        // 生成PDF文件名
        const fileName = `健康评估报告_${assessment.assessment_code}_${Date.now()}.pdf`;
        const filePath = path.join(__dirname, 'uploads', fileName);

        // 使用Puppeteer生成PDF
        // 这里使用简单的HTML模板生成PDF
        const htmlContent = generateReportHTML(assessment, analysis, report_type);

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setContent(htmlContent);
        await page.pdf({
            path: filePath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });
        await browser.close();

        // 获取文件大小
        const stats = fs.statSync(filePath);
        const fileSize = stats.size;

        // 记录到数据库
        await dbPool.execute(
            `INSERT INTO reports (assessment_id, user_id, report_type, report_url, file_name, file_size, is_generated)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                assessment_id,
                assessment.user_id,
                report_type,
                `/uploads/${fileName}`,
                fileName,
                fileSize,
                true
            ]
        );

        res.json({
            code: 200,
            message: '报告生成成功',
            data: {
                report_url: `/uploads/${fileName}`,
                file_name: fileName,
                file_size: fileSize
            }
        });

    } catch (error) {
        console.error('生成报告失败:', error);
        res.status(500).json({ code: 500, message: '生成报告失败: ' + error.message });
    }
});

// 生成报告HTML的辅助函数
function generateReportHTML(assessment, analysis, reportType) {
    const causeAnalysis = JSON.parse(analysis.cause_analysis || '{}');
    const organAnalysis = JSON.parse(analysis.organ_analysis || '{}');
    const constitutionAnalysis = JSON.parse(analysis.constitution_analysis || '{}');

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>健康评估报告 - ${assessment.assessment_code}</title>
    <style>
        body {
            font-family: "Microsoft YaHei", Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #d4af37;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #333;
            margin: 0;
            font-size: 28px;
        }
        .header p {
            color: #666;
            margin: 10px 0 0 0;
            font-size: 14px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #d4af37;
            margin-bottom: 15px;
            padding-left: 10px;
            border-left: 4px solid #d4af37;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        .info-item {
            padding: 10px;
            background: #f9f9f9;
            border-radius: 4px;
        }
        .info-label {
            font-weight: bold;
            color: #666;
            font-size: 14px;
        }
        .info-value {
            color: #333;
            font-size: 16px;
            margin-top: 5px;
        }
        .score-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 20px;
        }
        .score-value {
            font-size: 48px;
            font-weight: bold;
        }
        .score-label {
            font-size: 16px;
            margin-top: 5px;
        }
        .chart-placeholder {
            height: 200px;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #999;
            border-radius: 4px;
            margin: 10px 0;
        }
        .recommendation {
            background: #fff8e1;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
        }
        .recommendation-title {
            font-weight: bold;
            color: #f57c00;
            margin-bottom: 10px;
        }
        .recommendation-text {
            line-height: 1.6;
            color: #555;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #999;
            font-size: 12px;
        }
        @media print {
            body { background: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>元炁源流 · 健康评估报告</h1>
            <p>报告编号：${assessment.assessment_code}</p>
            <p>生成时间：${new Date().toLocaleString('zh-CN')}</p>
        </div>

        <div class="section">
            <div class="section-title">一、基本信息</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">姓名</div>
                    <div class="info-value">${assessment.real_name}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">性别</div>
                    <div class="info-value">${assessment.gender === 'male' ? '男' : '女'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">年龄</div>
                    <div class="info-value">${assessment.age}岁</div>
                </div>
                <div class="info-item">
                    <div class="info-label">评估日期</div>
                    <div class="info-value">${new Date(assessment.assessment_date).toLocaleDateString('zh-CN')}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">身高</div>
                    <div class="info-value">${assessment.height || '-'} cm</div>
                </div>
                <div class="info-item">
                    <div class="info-label">体重</div>
                    <div class="info-value">${assessment.weight || '-'} kg</div>
                </div>
                <div class="info-item">
                    <div class="info-label">腰围</div>
                    <div class="info-value">${assessment.waist_circumference || '-'} cm</div>
                </div>
                <div class="info-item">
                    <div class="info-label">症状总数</div>
                    <div class="info-value">${assessment.total_symptoms}项</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">二、健康评分</div>
            <div class="score-box">
                <div class="score-value">${analysis.overall_health_score}</div>
                <div class="score-label">综合健康评分</div>
                <div style="margin-top: 10px; font-size: 14px;">
                    健康等级：${analysis.health_level === 'excellent' ? '优秀' : (analysis.health_level === 'good' ? '良好' : (analysis.health_level === 'fair' ? '一般' : '较差'))}
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">三、病因分析</div>
            <div class="chart-placeholder">
                病因分析图表
            </div>
            <div style="margin-top: 10px; color: #666; font-size: 14px;">
                ${Object.entries(causeAnalysis).map(([key, value]) => `${key}：${value}`).join(' | ')}
            </div>
        </div>

        <div class="section">
            <div class="section-title">四、脏腑分析</div>
            <div class="chart-placeholder">
                脏腑分析图表
            </div>
            <div style="margin-top: 10px; color: #666; font-size: 14px;">
                ${Object.entries(organAnalysis).map(([key, value]) => `${key}：${value}`).join(' | ')}
            </div>
        </div>

        <div class="section">
            <div class="section-title">五、体质分析</div>
            <div class="chart-placeholder">
                体质分析图表
            </div>
            <div style="margin-top: 10px; color: #666; font-size: 14px;">
                ${Object.entries(constitutionAnalysis).map(([key, value]) => `${key}：${value}`).join(' | ')}
            </div>
        </div>

        <div class="section">
            <div class="section-title">六、调理建议</div>
            <div class="recommendation">
                <div class="recommendation-title">综合调理方案</div>
                <div class="recommendation-text">
                    ${analysis.recommendations.replace(/\n/g, '<br>')}
                </div>
            </div>
        </div>

        <div class="footer">
            <p>本报告仅供参考，具体调理方案请咨询专业医师</p>
            <p>元炁源流 · 养身·养心·养生</p>
        </div>
    </div>
</body>
</html>
    `;
}

// 6. 后台管理API

// 获取所有评估（管理员/调理师）
app.get('/api/admin/assessments', authenticateToken, requirePractitioner, async (req, res) => {
    try {
        const { page = 1, limit = 50, status, start_date, end_date } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT a.*, u.username, u.phone FROM assessments a LEFT JOIN users u ON a.user_id = u.id WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as total FROM assessments WHERE 1=1';
        let params = [];
        let countParams = [];

        if (status) {
            query += ' AND a.status = ?';
            countQuery += ' AND status = ?';
            params.push(status);
            countParams.push(status);
        }

        if (start_date) {
            query += ' AND a.assessment_date >= ?';
            countQuery += ' AND assessment_date >= ?';
            params.push(start_date);
            countParams.push(start_date);
        }

        if (end_date) {
            query += ' AND a.assessment_date <= ?';
            countQuery += ' AND assessment_date <= ?';
            params.push(end_date);
            countParams.push(end_date);
        }

        query += ' ORDER BY a.assessment_date DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [assessments] = await dbPool.execute(query, params);
        const [countResult] = await dbPool.execute(countQuery, countParams);

        // 获取统计数据
        const [stats] = await dbPool.execute(`
            SELECT
                COUNT(*) as total_assessments,
                COUNT(CASE WHEN DATE(assessment_date) = CURDATE() THEN 1 END) as today_assessments,
                COUNT(CASE WHEN status = 'draft' THEN 1 END) as pending_analyses,
                COUNT(CASE WHEN status = 'analyzed' THEN 1 END) as completed_reports
            FROM assessments
        `);

        const total = countResult[0].total;

        res.json({
            code: 200,
            message: '获取成功',
            data: {
                total: total,
                page: parseInt(page),
                limit: parseInt(limit),
                statistics: stats[0],
                assessments: assessments
            }
        });

    } catch (error) {
        console.error('获取评估列表失败:', error);
        res.status(500).json({ code: 500, message: '获取评估列表失败: ' + error.message });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ code: 200, message: '服务正常运行', timestamp: new Date().toISOString() });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({ code: 404, message: '接口不存在' });
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
});

// 启动服务器
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`元炁源流健康评估系统 - 后端API服务已启动`);
    console.log(`服务地址: http://localhost:${PORT}`);
    console.log(`API文档: http://localhost:${PORT}/api/health`);
});

// 优雅关闭
process.on('SIGTERM', async () => {
    console.log('收到SIGTERM信号，正在关闭服务器...');
    await dbPool.end();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('收到SIGINT信号，正在关闭服务器...');
    await dbPool.end();
    process.exit(0);
});
