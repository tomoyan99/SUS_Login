const crypto = require('crypto');
const {pbkdf2Sync} = require("crypto");

// ランダムな16バイトのソルトを生成する
const salt = crypto.randomBytes(32).toString('hex');
// 初期ベクトル
const iv = crypto.randomBytes(32).toString('hex')

// ソルト化するパスワード
const password = 'password123';

// AESキーの生成(128bit、5万回)
const key = pbkdf2Sync(password, salt, {
    keySize: 128 / 32,
    iterations: 50000,
    hasher: has,
});

// パスワードとソルトを結合する
const saltedPassword = password + salt;

// SHA256ハッシュ関数を使用して、ソルトとパスワードを混ぜ合わせてハッシュ化する
const hashedPassword = crypto.createHash('sha256').update(saltedPassword).digest('hex');

console.log('ソルト：', salt);
console.log('ソルト化されたパスワード：', saltedPassword);
console.log('ソルト化されたパスワードのハッシュ値：', hashedPassword);

