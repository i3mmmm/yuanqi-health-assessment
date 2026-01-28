-- 元炁源流健康评估系统 - 数据库初始化脚本
-- 版本: 1.0.0
-- 执行方式: mysql -u root -p < database_schema.sql

-- 创建数据库
CREATE DATABASE IF NOT EXISTS yuanqi_health CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE yuanqi_health;

-- ========================================
-- 1. 用户表 (users)
-- ========================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    real_name VARCHAR(50) COMMENT '真实姓名',
    phone VARCHAR(20) UNIQUE COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    role ENUM('customer', 'practitioner', 'admin') DEFAULT 'customer' COMMENT '角色：客户/调理师/管理员',
    avatar_url VARCHAR(255) COMMENT '头像URL',
    status ENUM('active', 'inactive', 'banned') DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    INDEX idx_phone (phone),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ========================================
-- 2. 评估记录表 (assessments)
-- ========================================
DROP TABLE IF EXISTS assessments;
CREATE TABLE assessments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID，关联users表',
    assessment_code VARCHAR(32) UNIQUE NOT NULL COMMENT '评估编号',
    assessment_date DATETIME NOT NULL COMMENT '评估时间',
    
    -- 基础信息
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    age INT NOT NULL COMMENT '年龄',
    gender ENUM('male', 'female') NOT NULL COMMENT '性别',
    height DECIMAL(5,2) COMMENT '身高(cm)',
    weight DECIMAL(5,2) COMMENT '体重(kg)',
    waist_circumference INT COMMENT '腰围(cm)',
    blood_sugar DECIMAL(5,2) COMMENT '血糖(mmol/L)',
    systolic_pressure INT COMMENT '收缩压(mmHg)',
    diastolic_pressure INT COMMENT '舒张压(mmHg)',
    remarks TEXT COMMENT '备注',
    
    -- 统计信息
    total_symptoms INT DEFAULT 0 COMMENT '症状总数',
    total_score DECIMAL(10,2) DEFAULT 0 COMMENT '症状总分',
    avg_score DECIMAL(5,2) DEFAULT 0 COMMENT '平均分',
    
    -- 状态
    status ENUM('draft', 'completed', 'analyzed', 'archived') DEFAULT 'draft' COMMENT '状态',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_assessment_code (assessment_code),
    INDEX idx_assessment_date (assessment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评估记录表';

-- ========================================
-- 3. 症状详情表 (assessment_symptoms)
-- ========================================
DROP TABLE IF EXISTS assessment_symptoms;
CREATE TABLE assessment_symptoms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    assessment_id INT NOT NULL COMMENT '评估记录ID',
    symptom_id INT NOT NULL COMMENT '症状ID，关联symptom_library表',
    
    -- 症状信息
    symptom_name VARCHAR(100) NOT NULL COMMENT '症状名称',
    side ENUM('left', 'right', 'both') COMMENT '位置：左侧/右侧/双侧',
    intensity INT NOT NULL DEFAULT 1 COMMENT '严重程度(1-20)',
    severity ENUM('mild', 'moderate', 'severe') COMMENT '轻度/中度/重度',
    
    -- 原因标签（JSON格式存储）
    cause_labels JSON COMMENT '原因标签数组',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    INDEX idx_assessment_id (assessment_id),
    INDEX idx_symptom_id (symptom_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评估症状详情表';

-- ========================================
-- 4. 症状库表 (symptom_library)
-- ========================================
DROP TABLE IF EXISTS symptom_library;
CREATE TABLE symptom_library (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE COMMENT '症状名称',
    color_region ENUM('red', 'green', 'yellow', 'blue') COMMENT '颜色区域',
    organ VARCHAR(100) COMMENT '所属脏腑',
    
    -- 原因标签（JSON格式）
    causes JSON COMMENT '原因标签数组，包含label和detail',
    warnings JSON COMMENT '预警信息数组',
    taboos JSON COMMENT '禁忌事项数组',
    
    severity ENUM('mild', 'moderate', 'severe') DEFAULT 'mild' COMMENT '默认严重程度',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_name (name),
    INDEX idx_organ (organ)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='症状库表';

-- ========================================
-- 5. 分析结果表 (analysis_results)
-- ========================================
DROP TABLE IF EXISTS analysis_results;
CREATE TABLE analysis_results (
    id INT PRIMARY KEY AUTO_INCREMENT,
    assessment_id INT NOT NULL COMMENT '评估记录ID',
    
    -- 病因分析（JSON格式）
    cause_analysis JSON COMMENT '病因分析：微循环、体质、毒素等8维度',
    
    -- 脏腑分析（JSON格式）
    organ_analysis JSON COMMENT '脏腑分析：肝、胃、肾、脾等',
    
    -- 体质分析（JSON格式）
    constitution_analysis JSON COMMENT '体质分析：血虚、寒凉、气虚等9种体质',
    
    -- 注意事项（JSON格式）
    precautions JSON COMMENT '注意事项：衰老、副作用、脾、胃等',
    
    -- 禁忌事项（JSON格式）
    taboos JSON COMMENT '禁忌事项：油腻、酒、生冷等',
    
    -- 情绪状态（JSON格式）
    emotion_analysis JSON COMMENT '情绪状态：怒、压力、思、抑郁等',
    
    -- 健康趋势（JSON格式）
    health_trends JSON COMMENT '健康趋势：外伤、遗传、高血压等',
    
    -- 生活习惯（JSON格式）
    lifestyle_habits JSON COMMENT '生活习惯：熬夜、用眼过度、过劳等',
    
    -- 营养分析（JSON格式）
    mineral_deficiency JSON COMMENT '矿物质缺乏：钙、锌、硒等',
    vitamin_deficiency JSON COMMENT '维生素缺乏：A、C、E、B族等',
    
    -- 总体评估
    overall_health_score DECIMAL(5,2) COMMENT '总体健康评分(0-100)',
    health_level ENUM('excellent', 'good', 'fair', 'poor') COMMENT '健康等级',
    primary_issues JSON COMMENT '主要问题列表（JSON数组）',
    recommendations TEXT COMMENT '调理建议',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '分析时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    INDEX idx_assessment_id (assessment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分析结果表';

-- ========================================
-- 6. 调理方案表 (health_plans)
-- ========================================
DROP TABLE IF EXISTS health_plans;
CREATE TABLE health_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    assessment_id INT NOT NULL COMMENT '评估记录ID',
    practitioner_id INT COMMENT '调理师ID（创建人）',
    
    plan_title VARCHAR(200) NOT NULL COMMENT '方案标题',
    plan_content TEXT COMMENT '方案详细内容',
    diet_advice TEXT COMMENT '饮食建议',
    lifestyle_advice TEXT COMMENT '生活建议',
    supplement_recommendation TEXT COMMENT '营养补充建议',
    
    status ENUM('draft', 'approved', 'rejected', 'completed') DEFAULT 'draft' COMMENT '方案状态',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (practitioner_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_assessment_id (assessment_id),
    INDEX idx_practitioner_id (practitioner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='调理方案表';

-- ========================================
-- 7. 报告文件表 (reports)
-- ========================================
DROP TABLE IF EXISTS reports;
CREATE TABLE reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    assessment_id INT NOT NULL COMMENT '评估记录ID',
    user_id INT NOT NULL COMMENT '用户ID',
    
    report_type ENUM('assessment', 'comparison', 'trend', 'plan') NOT NULL COMMENT '报告类型',
    report_url VARCHAR(500) NOT NULL COMMENT '报告文件URL',
    file_name VARCHAR(255) NOT NULL COMMENT '文件名',
    file_size INT COMMENT '文件大小(字节)',
    
    is_generated BOOLEAN DEFAULT TRUE COMMENT '是否已生成',
    download_count INT DEFAULT 0 COMMENT '下载次数',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '生成时间',
    
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_assessment_id (assessment_id),
    INDEX idx_user_id (user_id),
    INDEX idx_report_type (report_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报告文件表';

-- ========================================
-- 8. 系统配置表 (system_config)
-- ========================================
DROP TABLE IF EXISTS system_config;
CREATE TABLE system_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    description VARCHAR(500) COMMENT '配置描述',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';

-- ========================================
-- 插入初始数据
-- ========================================

-- 插入默认管理员用户
-- 密码为: admin123
INSERT INTO users (username, password_hash, real_name, phone, email, role, status) VALUES
('admin', '$2a$10$rKxWv9XkGmGz8Z6YqHn1VeH3YmJh5Y8zQzL4K5YmJh5Y8zQzL4K5', '系统管理员', '13800000000', 'admin@yuanqiyuanliu.com', 'admin', 'active'),
('practitioner1', '$2a$10$rKxWv9XkGmGz8Z6YqHn1VeH3YmJh5Y8zQzL4K5YmJh5Y8zQzL4K5', '李调理师', '13800000001', 'li@yuanqiyuanliu.com', 'practitioner', 'active');

-- 插入系统配置
INSERT INTO system_config (config_key, config_value, description) VALUES
('system_name', '元炁源流健康评估系统', '系统名称'),
('system_version', '1.0.0', '系统版本'),
('contact_phone', '400-123-4567', '客服电话'),
('contact_email', 'support@yuanqiyuanliu.com', '客服邮箱'),
('wechat_qr_code', '', '微信公众号二维码'),
('report_template', 'default', '报告模板类型'),
('enable_registration', 'true', '是否允许用户注册'),
('max_assessment_per_day', '3', '每日最大评估次数');

-- ========================================
-- 创建视图（便于查询）
-- ========================================

-- 评估详情视图
CREATE OR REPLACE VIEW v_assessment_details AS
SELECT 
    a.*,
    u.username,
    u.phone,
    u.email,
    u.role as user_role,
    ar.cause_analysis,
    ar.organ_analysis,
    ar.constitution_analysis,
    ar.precautions,
    ar.taboos,
    ar.emotion_analysis,
    ar.health_trends,
    ar.lifestyle_habits,
    ar.mineral_deficiency,
    ar.vitamin_deficiency,
    ar.overall_health_score,
    ar.health_level,
    ar.recommendations
FROM assessments a
LEFT JOIN users u ON a.user_id = u.id
LEFT JOIN analysis_results ar ON a.id = ar.assessment_id;

-- 用户评估统计视图
CREATE OR REPLACE VIEW v_user_assessment_stats AS
SELECT 
    user_id,
    u.username,
    u.real_name,
    COUNT(*) as total_assessments,
    AVG(total_score) as avg_score,
    MIN(assessment_date) as first_assessment,
    MAX(assessment_date) as last_assessment
FROM assessments a
LEFT JOIN users u ON a.user_id = u.id
GROUP BY user_id, u.username, u.real_name;

-- ========================================
-- 创建存储过程
-- ========================================

DELIMITER //

-- 生成评估编号的存储过程
CREATE PROCEDURE generate_assessment_code(OUT code VARCHAR(32))
BEGIN
    DECLARE date_str VARCHAR(10);
    DECLARE random_num INT;
    SET date_str = DATE_FORMAT(NOW(), '%Y%m%d');
    SET random_num = FLOOR(RAND() * 10000);
    SET code = CONCAT('YA', date_str, LPAD(random_num, 4, '0'));
END //

-- 计算用户健康趋势的存储过程
CREATE PROCEDURE calculate_user_health_trend(IN user_id_param INT)
BEGIN
    SELECT 
        a.id,
        a.assessment_code,
        a.assessment_date,
        a.total_score,
        a.avg_score,
        ar.overall_health_score,
        ar.health_level,
        LAG(a.total_score) OVER (ORDER BY a.assessment_date) as prev_total_score,
        a.total_score - LAG(a.total_score) OVER (ORDER BY a.assessment_date) as score_change
    FROM assessments a
    LEFT JOIN analysis_results ar ON a.id = ar.assessment_id
    WHERE a.user_id = user_id_param
    ORDER BY a.assessment_date DESC;
END //

DELIMITER ;

-- ========================================
-- 创建触发器
-- ========================================

DELIMITER //

-- 评估记录更新时触发：自动更新 updated_at
CREATE TRIGGER tr_assessments_update
BEFORE UPDATE ON assessments
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END //

-- 插入症状后自动更新评估统计
CREATE TRIGGER tr_assessment_symptoms_insert
AFTER INSERT ON assessment_symptoms
FOR EACH ROW
BEGIN
    UPDATE assessments SET
        total_symptoms = (SELECT COUNT(*) FROM assessment_symptoms WHERE assessment_id = NEW.assessment_id),
        total_score = (SELECT COALESCE(SUM(intensity), 0) FROM assessment_symptoms WHERE assessment_id = NEW.assessment_id),
        avg_score = (SELECT COALESCE(AVG(intensity), 0) FROM assessment_symptoms WHERE assessment_id = NEW.assessment_id),
        updated_at = NOW()
    WHERE id = NEW.assessment_id;
END //

-- 更新症状后自动更新评估统计
CREATE TRIGGER tr_assessment_symptoms_update
AFTER UPDATE ON assessment_symptoms
FOR EACH ROW
BEGIN
    UPDATE assessments SET
        total_symptoms = (SELECT COUNT(*) FROM assessment_symptoms WHERE assessment_id = NEW.assessment_id),
        total_score = (SELECT COALESCE(SUM(intensity), 0) FROM assessment_symptoms WHERE assessment_id = NEW.assessment_id),
        avg_score = (SELECT COALESCE(AVG(intensity), 0) FROM assessment_symptoms WHERE assessment_id = NEW.assessment_id),
        updated_at = NOW()
    WHERE id = NEW.assessment_id;
END //

-- 删除症状后自动更新评估统计
CREATE TRIGGER tr_assessment_symptoms_delete
AFTER DELETE ON assessment_symptoms
FOR EACH ROW
BEGIN
    UPDATE assessments SET
        total_symptoms = (SELECT COUNT(*) FROM assessment_symptoms WHERE assessment_id = OLD.assessment_id),
        total_score = (SELECT COALESCE(SUM(intensity), 0) FROM assessment_symptoms WHERE assessment_id = OLD.assessment_id),
        avg_score = (SELECT COALESCE(AVG(intensity), 0) FROM assessment_symptoms WHERE assessment_id = OLD.assessment_id),
        updated_at = NOW()
    WHERE id = OLD.assessment_id;
END //

DELIMITER ;

-- ========================================
-- 执行完成提示
-- ========================================
SELECT '数据库初始化完成！' AS message;
SELECT '默认管理员账号: admin / admin123' AS admin_info;
SELECT '默认调理师账号: practitioner1 / admin123' AS practitioner_info;
