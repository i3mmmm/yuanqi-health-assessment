/**
 * 自动创建数据库表脚本
 * 用法：node create_tables.js
 */

const mysql = require('mysql2');
const fs = require('fs');

console.log('正在连接到Zeabur MySQL数据库...\n');

// 数据库连接配置
const connection = mysql.createConnection({
  host: 'sjc1.clusters.zeabur.com',
  port: 27983,
  user: 'root',
  password: '9ODHR03Mp6hw8iYPq1en4QgrU275tEzc',
  database: 'zeabur',
  multipleStatements: true  // 允许执行多条SQL语句
});

connection.connect((err) => {
  if (err) {
    console.error('❌ 连接失败！');
    console.error('错误信息:', err.message);
    process.exit(1);
  }

  console.log('✅ 连接成功！\n');

  // 读取数据库架构文件
  console.log('正在读取 database_schema.sql 文件...');

  try {
    const sqlContent = fs.readFileSync('database_schema.sql', 'utf8');

    console.log('文件读取成功，正在创建数据库表...\n');

    // 执行SQL语句
    connection.query(sqlContent, (error, results, fields) => {
      if (error) {
        console.error('❌ 创建表失败！');
        console.error('错误信息:', error.message);
        connection.end();
        process.exit(1);
      }

      console.log('✅ 数据库表创建成功！\n');

      // 验证表是否创建成功
      connection.query('SHOW TABLES', (error, tables) => {
        if (error) {
          console.error('查询表失败:', error.message);
        } else {
          console.log(`成功创建 ${tables.length} 张表：\n`);
          tables.forEach((row, index) => {
            const tableName = Object.values(row)[0];
            console.log(`  ${index + 1}. ${tableName}`);
          });
        }

        console.log('\n🎉 数据库初始化完成！');
        connection.end();
      });
    });

  } catch (err) {
    console.error('❌ 读取文件失败！');
    console.error('错误信息:', err.message);
    console.error('请确保 database_schema.sql 文件存在于当前目录');
    connection.end();
    process.exit(1);
  }
});
