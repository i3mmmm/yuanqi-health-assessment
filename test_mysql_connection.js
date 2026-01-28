/**
 * 测试MySQL连接脚本
 * 用法：node test_mysql_connection.js
 */

const mysql = require('mysql2');

console.log('正在连接到Zeabur MySQL数据库...\n');

// 数据库连接配置
const connection = mysql.createConnection({
  host: 'sjc1.clusters.zeabur.com',
  port: 27983,
  user: 'root',
  password: '9ODHR03Mp6hw8iYPq1en4QgrU275tEzc',
  database: 'zeabur'
});

// 尝试连接
connection.connect((err) => {
  if (err) {
    console.error('❌ 连接失败！');
    console.error('错误信息:', err.message);
    console.error('\n请检查：');
    console.error('1. 网络连接是否正常');
    console.error('2. MySQL服务是否正在运行');
    console.error('3. 连接参数是否正确');
    process.exit(1);
  }

  console.log('✅ 连接成功！');
  console.log('数据库信息：');
  console.log('  Host: sjc1.clusters.zeabur.com');
  console.log('  Port: 27983');
  console.log('  Database: zeabur');
  console.log('\n正在查询数据库表...\n');

  // 查看有哪些表
  connection.query('SHOW TABLES', (error, results, fields) => {
    if (error) {
      console.error('查询失败:', error.message);
      connection.end();
      process.exit(1);
    }

    if (results.length === 0) {
      console.log('数据库还没有创建任何表，需要先创建表架构');
    } else {
      console.log(`找到 ${results.length} 张表：`);
      results.forEach((row, index) => {
        const tableName = Object.values(row)[0];
        console.log(`  ${index + 1}. ${tableName}`);
      });
    }

    connection.end();
    console.log('\n连接已关闭');
  });
});

// 设置超时
connection.on('error', (err) => {
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('连接超时，可能网络不稳定');
  }
});
