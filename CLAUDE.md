# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述
利用Primus SDK实现无需授权的验证各种视频平台，然后进行会员的共享，利用Monad进行支付

## 项目实现功能
1. 前端连接钱包，连接Monad testnet
2. 连接钱包，然后签名，把签名和地址发送在后端，在后端对签名验证，保存在用户数据库
3. 用户登录后，对视频平台进行验证。比如哔哩哔哩平台，点击验证，利用primus sdk跳转去验证，验证通过后，把绑定结果保存在用户数据库
4. 优酷也是如此连接，验证的，保存的
5. 连接验证后，需要从后端获取数据，在页面上显示已经连接和vip时间
6. 保密配置数据放在.env

## primus返回数据
1. bilibili：  "data": "{\"current_level\":\"6\",\"vipDueDate\":\"1776700800000\"}",、
2. youku：  "data": "{\"exptime\":\"2026-03-09\",\"is_vip\":\"1\"}",


## 技术栈
- **前端框架**: Next.js + TypeScript
- **区块链前端**: Rainbow+wagmi
- **密码学层**: Primus SDK (zkTLS/zkFHE) 文档： @docs/primus.md
- **构建工具**: Vite
- **数据库**: Postgres

## 支持的区块链
- Monad Testnet

## 网络信息
### Monad Testnet
- **网络名称**: Monad Testnet
- **Chain ID**: 10143
- **货币符号**: MON
- **区块浏览器**: https://testnet.monadexplorer.com

### 公共 RPC 端点
| RPC URL | 提供者 | 请求限制 | 批处理调用限制 | 其他限制 |
|---------|--------|----------|----------------|----------|
| https://testnet-rpc.monad.xyz | QuickNode | 25 请求/秒 | 100 | - |
| https://rpc.ankr.com/monad_testnet | Ankr | 300 请求/10 秒，12000 请求/10 分钟 | 100 | 不允许 debug_* 方法 |
| https://rpc-testnet.monadinfra.com | Monad Foundation | 20 请求/秒 | 不允许 | 不允许 eth_getLogs 和 debug_* 方法 |
