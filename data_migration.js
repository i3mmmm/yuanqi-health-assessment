/**
 * 数据迁移脚本
 * 将现有的JSON文件数据迁移到MySQL数据库
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 数据库配置
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'your_password', // 请修改为实际密码
    database: 'health_assessment',
    multipleStatements: true
};

// 数据文件路径
const dataPath = path.join(__dirname);

// 症状数据文件
const symptomFiles = [
    'symptoms_299_complete.json'
];

// 评估数据文件
const assessmentFiles = [
    'first_assessment_20251213.json',
    'second_assessment_20260113.json',
    'sample_assessment_data.json'
];

// ==================== 数据库连接 ====================
async function connectDatabase() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('✓ 数据库连接成功');
        return connection;
    } catch (error) {
        console.error('✗ 数据库连接失败:', error.message);
        throw error;
    }
}

// ==================== 迁移症状库 ====================
async function migrateSymptoms(connection) {
    console.log('\n========== 开始迁移症状库 ==========');

    for (const file of symptomFiles) {
        const filePath = path.join(dataPath, file);

        if (!fs.existsSync(filePath)) {
            console.log(`⚠ 文件不存在，跳过: ${file}`);
            continue;
        }

        try {
            // 读取JSON文件
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            if (!data.symptoms || data.symptoms.length === 0) {
                console.log(`⚠ ${file} 中没有症状数据`);
                continue;
            }

            console.log(`\n处理文件: ${file}`);
            console.log(`症状数量: ${data.symptoms.length}`);

            let successCount = 0;
            let skipCount = 0;

            for (const symptom of data.symptoms) {
                try {
                    // 检查是否已存在
                    const [existing] = await connection.execute(
                        'SELECT id FROM symptom_library WHERE name = ?',
                        [symptom.name]
                    );

                    if (existing.length > 0) {
                        console.log(`  跳过已存在: ${symptom.name}`);
                        skipCount++;
                        continue;
                    }

                    // 插入症状
                    const [result] = await connection.execute(
                        `INSERT INTO symptom_library 
                        (name, color_region, organ, severity, causes, warnings, taboos, side, description) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            symptom.name,
                            symptom.colorRegion || null,
                            symptom.organ || null,
                            symptom.severity || 'moderate',
                            symptom.causes ? JSON.stringify(symptom.causes) : null,
                            symptom.warnings ? JSON.stringify(symptom.warnings) : null,
                            symptom.taboos ? JSON.stringify(symptom.taboos) : null,
                            symptom.side || 'both',
                            symptom.description || null
                        ]
                    );

                    successCount++;
                    console.log(`  ✓ 导入: ${symptom.name} (ID: ${result.insertId})`);

                } catch (error) {
                    console.error(`  ✗ 导入失败: ${symptom.name}`, error.message);
                }
            }

            console.log(`\n✓ ${file} 迁移完成: 成功 ${successCount} 条，跳过 ${skipCount} 条`);

        } catch (error) {
            console.error(`✗ 处理文件失败: ${file}`, error.message);
        }
    }
}

// ==================== 迁移评估数据 ====================
async function migrateAssessments(connection) {
    console.log('\n========== 开始迁移评估数据 ==========');

    for (const file of assessmentFiles) {
        const filePath = path.join(dataPath, file);

        if (!fs.existsSync(filePath)) {
            console.log(`⚠ 文件不存在，跳过: ${file}`);
            continue;
        }

        try {
            // 读取JSON文件
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            console.log(`\n处理文件: ${file}`);

            // 提取基本信息
            const basicInfo = data['基本信息'] || {};
            const symptomsData = data['症状数据'] || [];
            const causeAnalysis = data['病因分析'] || {};
            const organAnalysis = data['脏腑分析'] || {};
            const constitutionAnalysis = data['体质分析'] || {};
            const mineralDeficiency = data['矿物质缺乏'] || {};
            const vitaminDeficiency = data['维生素缺乏'] || {};
            const healthTrend = data['健康趋势'] || {};
            const healthPlan = data['调理方案'] || {};

            // 创建评估记录
            const [assessmentResult] = await connection.execute(
                `INSERT INTO assessments 
                (user_id, assessment_date, real_name, phone, age, gender, height, weight, waist_circumference, 
                 blood_sugar, systolic_pressure, diastolic_pressure, remarks, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    1, // 默认用户ID
                    basicInfo['检测日期'] || basicInfo['提交时间'] || new Date(),
                    basicInfo['姓名'] || '未知',
                    basicInfo['手机号'] || basicInfo['手机'] || null,
                    basicInfo['年龄'] || null,
                    basicInfo['性别'] === '男' ? 'male' : (basicInfo['性别'] === '女' ? 'female' : null),
                    basicInfo['身高'] || null,
                    basicInfo['体重'] || null,
                    basicInfo['腰围'] || null,
                    basicInfo['血糖'] || null,
                    basicInfo['收缩压'] || null,
                    basicInfo['舒张压'] || null,
                    basicInfo['备注'] || null,
                    'completed'
                ]
            );

            const assessmentId = assessmentResult.insertId;
            console.log(`✓ 创建评估记录 (ID: ${assessmentId})`);

            // 插入症状
            let symptomCount = 0;
            for (const symptom of symptomsData) {
                // 查找症状ID
                const [symptomRows] = await connection.execute(
                    'SELECT id FROM symptom_library WHERE name = ?',
                    [symptom['名称']]
                );

                if (symptomRows.length === 0) {
                    console.log(`  ⚠ 症状不存在: ${symptom['名称']}`);
                    continue;
                }

                const symptomId = symptomRows[0].id;

                // 确定严重程度
                const intensity = symptom['强度'] || 1;
                let severity = 'mild';
                if (intensity > 6 && intensity <= 13) {
                    severity = 'moderate';
                } else if (intensity > 13) {
                    severity = 'severe';
                }

                // 确定位置
                const position = symptom['位置'] || 'both';

                // 插入评估症状关联
                await connection.execute(
                    `INSERT INTO assessment_symptoms 
                    (assessment_id, symptom_id, intensity, severity, position)
                    VALUES (?, ?, ?, ?, ?)`,
                    [assessmentId, symptomId, intensity, severity, position]
                );

                symptomCount++;
            }
            console.log(`✓ 插入症状: ${symptomCount} 条`);

            // 计算健康评分
            const healthScore = calculateHealthScore(symptomsData, causeAnalysis, constitutionAnalysis);
            
            // 更新评估记录的健康评分
            await connection.execute(
                'UPDATE assessments SET health_score = ? WHERE id = ?',
                [healthScore, assessmentId]
            );

            // 插入分析结果
            await connection.execute(
                `INSERT INTO analysis_results 
                (assessment_id, cause_analysis, organ_analysis, constitution_analysis, 
                 mineral_deficiency, vitamin_deficiency, health_trend)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    assessmentId,
                    causeAnalysis && Object.keys(causeAnalysis).length > 0 
                        ? JSON.stringify(causeAnalysis) 
                        : JSON.stringify(performCauseAnalysis(symptomsData)),
                    organAnalysis && Object.keys(organAnalysis).length > 0 
                        ? JSON.stringify(organAnalysis) 
                        : JSON.stringify(performOrganAnalysis(symptomsData)),
                    constitutionAnalysis && Object.keys(constitutionAnalysis).length > 0 
                        ? JSON.stringify(constitutionAnalysis) 
                        : JSON.stringify(performConstitutionAnalysis(symptomsData)),
                    mineralDeficiency && Object.keys(mineralDeficiency).length > 0 
                        ? JSON.stringify(mineralDeficiency) 
                        : JSON.stringify(performMineralAnalysis(symptomsData)),
                    vitaminDeficiency && Object.keys(vitaminDeficiency).length > 0 
                        ? JSON.stringify(vitaminDeficiency) 
                        : JSON.stringify(performVitaminAnalysis(symptomsData)),
                    healthTrend && Object.keys(healthTrend).length > 0 
                        ? JSON.stringify(healthTrend) 
                        : JSON.stringify(performTrendAnalysis(symptomsData))
                ]
            );
            console.log(`✓ 插入分析结果 (评分: ${healthScore})`);

            // 插入调理方案
            await connection.execute(
                `INSERT INTO health_plans 
                (assessment_id, recommendations, diet_advice, lifestyle_advice)
                VALUES (?, ?, ?, ?)`,
                [
                    assessmentId,
                    healthPlan['建议'] || null,
                    healthPlan['饮食建议'] || null,
                    healthPlan['生活方式'] || null
                ]
            );
            console.log(`✓ 插入调理方案`);

            console.log(`\n✓ ${file} 迁移完成`);

        } catch (error) {
            console.error(`✗ 处理文件失败: ${file}`, error.message);
        }
    }
}

// ==================== 辅助分析函数 ====================

/**
 * 计算健康评分
 */
function calculateHealthScore(symptoms, causeAnalysis, constitutionAnalysis) {
    // 基础分100分
    let score = 100;

    // 根据症状数量扣分
    const symptomCount = symptoms.length;
    score -= symptomCount * 2;

    // 根据病因严重程度扣分
    if (causeAnalysis) {
        const causeSum = Object.values(causeAnalysis).reduce((sum, val) => sum + val, 0);
        score -= Math.floor(causeSum / 10);
    }

    // 根据体质异常扣分
    if (constitutionAnalysis) {
        const constitutionSum = Object.values(constitutionAnalysis).reduce((sum, val) => sum + val, 0);
        score -= Math.floor(constitutionSum / 5);
    }

    // 确保分数在0-100之间
    score = Math.max(0, Math.min(100, score));

    return score;
}

/**
 * 执行病因分析
 */
function performCauseAnalysis(symptoms) {
    const causes = {};

    symptoms.forEach(symptom => {
        const causeLabels = symptom['原因标签'] || [];
        const intensity = symptom['强度'] || 1;

        causeLabels.forEach(cause => {
            causes[cause] = (causes[cause] || 0) + intensity;
        });
    });

    return causes;
}

/**
 * 执行脏腑分析
 */
function performOrganAnalysis(symptoms) {
    const organs = {};

    symptoms.forEach(symptom => {
        const organLabels = symptom['器官标签'] || symptom['脏腑标签'] || [];
        const intensity = symptom['强度'] || 1;

        organLabels.forEach(organ => {
            organs[organ] = (organs[organ] || 0) + intensity;
        });
    });

    return organs;
}

/**
 * 执行体质分析
 */
function performConstitutionAnalysis(symptoms) {
    // 简化的体质映射
    const constitutionMap = {
        '手脚凉': '阳虚',
        '怕冷': '阳虚',
        '舌淡': '阳虚',
        '畏寒': '阳虚',
        '怕热': '阴虚',
        '口干': '阴虚',
        '咽干': '阴虚',
        '舌红': '阴虚',
        '疲劳': '气虚',
        '气短': '气虚',
        '自汗': '气虚',
        '面色苍白': '血虚',
        '头晕': '血虚',
        '心悸': '血虚',
        '体胖': '痰湿',
        '舌苔腻': '痰湿',
        '面部出油': '痰湿',
        '急躁': '气郁',
        '情绪不稳': '气郁',
        '月经不调': '血瘀',
        '疼痛固定': '血瘀',
        '舌紫': '血瘀',
        '皮肤油腻': '湿热',
        '口苦': '湿热',
        '大便黏滞': '湿热'
    };

    const constitution = {};

    symptoms.forEach(symptom => {
        const name = symptom['名称'];
        const intensity = symptom['强度'] || 1;

        // 检查症状名称是否对应体质
        for (const [symptomKey, constitutionType] of Object.entries(constitutionMap)) {
            if (name.includes(symptomKey)) {
                constitution[constitutionType] = (constitution[constitutionType] || 0) + intensity;
                break;
            }
        }
    });

    return constitution;
}

/**
 * 执行矿物质缺乏分析
 */
function performMineralAnalysis(symptoms) {
    // 简化的矿物质缺乏映射
    const mineralMap = {
        '骨痛': '钙',
        '骨质疏松': '钙',
        '抽筋': '钙',
        '脱发': '锌',
        '皮肤问题': '锌',
        '免疫力低': '锌',
        '白内障': '硒',
        '视力模糊': '硒',
        '肌肉无力': '镁',
        '心悸': '镁',
        '贫血': '铁',
        '面色苍白': '铁',
        '血糖问题': '铬',
        '疲劳': '锰'
    };

    const minerals = {};

    symptoms.forEach(symptom => {
        const name = symptom['名称'];
        const intensity = symptom['强度'] || 1;

        for (const [symptomKey, mineral] of Object.entries(mineralMap)) {
            if (name.includes(symptomKey)) {
                minerals[mineral] = (minerals[mineral] || 0) + intensity;
                break;
            }
        }
    });

    return minerals;
}

/**
 * 执行维生素缺乏分析
 */
function performVitaminAnalysis(symptoms) {
    // 简化的维生素缺乏映射
    const vitaminMap = {
        '夜盲症': '维生素A',
        '眼干': '维生素A',
        '皮肤干燥': '维生素A',
        '牙龈出血': '维生素C',
        '免疫力低': '维生素C',
        '伤口愈合慢': '维生素C',
        '口腔溃疡': '维生素B',
        '神经炎': '维生素B',
        '贫血': '维生素B12',
        '肌肉萎缩': '维生素E',
        '不孕不育': '维生素E',
        '骨质疏松': '维生素D',
        '佝偻病': '维生素D'
    };

    const vitamins = {};

    symptoms.forEach(symptom => {
        const name = symptom['名称'];
        const intensity = symptom['强度'] || 1;

        for (const [symptomKey, vitamin] of Object.entries(vitaminMap)) {
            if (name.includes(symptomKey)) {
                vitamins[vitamin] = (vitamins[vitamin] || 0) + intensity;
                break;
            }
        }
    });

    return vitamins;
}

/**
 * 执行健康趋势分析
 */
function performTrendAnalysis(symptoms) {
    const trends = {};

    // 基于症状预测潜在健康风险
    const trendMap = {
        '高血压': '高血压风险',
        '高血糖': '糖尿病风险',
        '头痛': '脑血管疾病风险',
        '胸痛': '心血管疾病风险',
        '消化不良': '消化系统风险',
        '关节痛': '关节疾病风险',
        '失眠': '神经系统风险',
        '抑郁': '精神健康风险',
        '肿瘤': '肿瘤风险'
    };

    symptoms.forEach(symptom => {
        const name = symptom['名称'];
        const intensity = symptom['强度'] || 1;

        for (const [symptomKey, trend] of Object.entries(trendMap)) {
            if (name.includes(symptomKey)) {
                trends[trend] = intensity;
                break;
            }
        }
    });

    // 默认风险趋势
    if (symptoms.length > 10) {
        trends['慢性病风险'] = symptoms.length;
    }

    return trends;
}

// ==================== 创建默认管理员账户 ====================
async function createDefaultAdmin(connection) {
    console.log('\n========== 创建默认管理员账户 ==========');

    try {
        const bcrypt = require('bcryptjs');

        const username = 'admin';
        const password = 'admin123'; // 默认密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 检查是否已存在
        const [existing] = await connection.execute(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );

        if (existing.length > 0) {
            console.log('⚠ 管理员账户已存在，跳过创建');
            return;
        }

        // 创建管理员账户
        await connection.execute(
            `INSERT INTO users (username, password, real_name, phone, role) 
             VALUES (?, ?, ?, ?, ?)`,
            [username, hashedPassword, '系统管理员', null, 'admin']
        );

        console.log('✓ 默认管理员账户创建成功');
        console.log('  用户名: admin');
        console.log('  密码: admin123');
        console.log('  ⚠ 请登录后立即修改密码！');

    } catch (error) {
        console.error('✗ 创建管理员账户失败:', error.message);
    }
}

// ==================== 显示迁移统计 ====================
async function showMigrationStats(connection) {
    console.log('\n========== 迁移统计 ==========');

    try {
        const [symptomCount] = await connection.execute(
            'SELECT COUNT(*) as count FROM symptom_library'
        );
        console.log(`✓ 症状库记录: ${symptomCount[0].count} 条`);

        const [assessmentCount] = await connection.execute(
            'SELECT COUNT(*) as count FROM assessments'
        );
        console.log(`✓ 评估记录: ${assessmentCount[0].count} 条`);

        const [symptomDetailCount] = await connection.execute(
            'SELECT COUNT(*) as count FROM assessment_symptoms'
        );
        console.log(`✓ 评估症状: ${symptomDetailCount[0].count} 条`);

        const [analysisCount] = await connection.execute(
            'SELECT COUNT(*) as count FROM analysis_results'
        );
        console.log(`✓ 分析结果: ${analysisCount[0].count} 条`);

        const [userCount] = await connection.execute(
            'SELECT COUNT(*) as count FROM users'
        );
        console.log(`✓ 用户记录: ${userCount[0].count} 条`);

    } catch (error) {
        console.error('✗ 获取统计信息失败:', error.message);
    }
}

// ==================== 主函数 ====================
async function main() {
    console.log('========================================');
    console.log('  元炁源流健康评估系统 - 数据迁移工具');
    console.log('========================================');

    let connection;

    try {
        // 连接数据库
        connection = await connectDatabase();

        // 迁移症状库
        await migrateSymptoms(connection);

        // 迁移评估数据
        await migrateAssessments(connection);

        // 创建默认管理员账户
        await createDefaultAdmin(connection);

        // 显示统计信息
        await showMigrationStats(connection);

        console.log('\n========================================');
        console.log('  ✓ 数据迁移完成！');
        console.log('========================================\n');

    } catch (error) {
        console.error('\n✗ 数据迁移失败:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('✓ 数据库连接已关闭');
        }
    }
}

// 运行迁移
if (require.main === module) {
    main();
}

module.exports = {
    connectDatabase,
    migrateSymptoms,
    migrateAssessments,
    createDefaultAdmin
};
