#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
浏览器历史记录本地API服务
FastAPI + SQLite 实现增量存储浏览历史
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, field_validator
from typing import List, Optional, Dict, Any
import aiohttp
import json
import sqlite3
import datetime
import logging
import uvicorn
from contextlib import contextmanager

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 创建FastAPI应用
app = FastAPI(
    title="浏览器历史记录API",
    description="本地存储和管理浏览器历史记录",
    version="1.0.0"
)

# 配置模板和静态文件
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

# 配置CORS，允许Chrome扩展访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 添加请求验证错误处理器
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_details = []
    for error in exc.errors():
        error_details.append({
            "field": " -> ".join(str(x) for x in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    
    logger.error(f"请求验证失败: {error_details}")
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "请求数据验证失败",
            "errors": error_details
        }
    )

# 数据库配置
DATABASE_FILE = "browser_history.db"

# Pydantic模型
class HistoryItem(BaseModel):
    """单条历史记录模型"""
    url: str
    title: Optional[str] = None
    visitTime: int  # Unix时间戳（毫秒）
    visitCount: Optional[int] = 1
    
    @field_validator('url')
    @classmethod
    def validate_url(cls, v):
        if not v or not v.strip():
            raise ValueError('URL不能为空')
        return v.strip()
    
    @field_validator('visitTime')
    @classmethod
    def validate_visit_time(cls, v):
        if v <= 0:
            raise ValueError('访问时间必须为正数')
        return v
    
    @field_validator('visitCount')
    @classmethod
    def validate_visit_count(cls, v):
        if v is not None and v < 0:
            raise ValueError('访问次数不能为负数')
        return v or 1
    
class HistoryBatch(BaseModel):
    """批量历史记录模型"""
    items: List[HistoryItem]

class AIConfig(BaseModel):
    """AI配置模型"""
    name: str
    type: str  # ollama, openai, anthropic等
    base_url: str
    api_key: Optional[str] = None
    model: str
    max_tokens: Optional[int] = 2048
    temperature: Optional[float] = 0.7
    is_active: Optional[bool] = True

class AgentTemplate(BaseModel):
    """AI Agent模板模型"""
    name: str
    description: str
    system_prompt: str
    user_prompt_template: str
    ai_config: str  # AI配置名称
    is_active: Optional[bool] = True

class AITestRequest(BaseModel):
    """AI测试请求模型"""
    config_name: str
    prompt: str
    use_template: Optional[str] = None

class OllamaTestRequest(BaseModel):
    """Ollama连接测试请求"""
    base_url: str
    model: Optional[str] = "llama2"
    
class ApiResponse(BaseModel):
    """API响应模型"""
    success: bool
    message: str
    data: Optional[dict] = None

# 数据库操作
@contextmanager
def get_db_connection():
    """获取数据库连接的上下文管理器"""
    conn = None
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        conn.row_factory = sqlite3.Row  # 使查询结果可以像字典一样访问
        yield conn
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"数据库操作错误: {e}")
        raise
    finally:
        if conn:
            conn.close()

def init_database():
    """初始化数据库表"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # 创建历史记录表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS browser_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT NOT NULL,
                title TEXT,
                visit_time INTEGER NOT NULL,
                visit_count INTEGER DEFAULT 1,
                first_visit_time INTEGER NOT NULL,
                last_visit_time INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(url, visit_time)
            )
        ''')
        
        # 创建索引以提高查询性能
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_url ON browser_history(url)
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_visit_time ON browser_history(visit_time)
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_last_visit_time ON browser_history(last_visit_time)
        ''')
        
        # 创建统计表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sync_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                total_synced INTEGER DEFAULT 0,
                last_sync_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                sync_count INTEGER DEFAULT 0
            )
        ''')
        
        # 创建AI配置表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ai_configs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                type TEXT NOT NULL,
                base_url TEXT NOT NULL,
                api_key TEXT,
                model TEXT NOT NULL,
                max_tokens INTEGER DEFAULT 2048,
                temperature REAL DEFAULT 0.7,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 创建Agent模板表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS agent_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT NOT NULL,
                system_prompt TEXT NOT NULL,
                user_prompt_template TEXT NOT NULL,
                ai_config TEXT NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ai_config) REFERENCES ai_configs (name)
            )
        ''')
        
        conn.commit()
        logger.info("数据库初始化完成")

def insert_or_update_history_item(cursor, item: HistoryItem) -> bool:
    """插入或更新单条历史记录"""
    try:
        # 检查是否已存在相同的URL和访问时间
        cursor.execute('''
            SELECT id, visit_count, first_visit_time, last_visit_time 
            FROM browser_history 
            WHERE url = ? AND visit_time = ?
        ''', (item.url, item.visitTime))
        
        existing = cursor.fetchone()
        
        if existing:
            # 更新现有记录
            cursor.execute('''
                UPDATE browser_history 
                SET title = COALESCE(?, title),
                    visit_count = ?,
                    last_visit_time = MAX(last_visit_time, ?),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (
                item.title, 
                max(existing['visit_count'], item.visitCount or 1),
                item.visitTime,
                existing['id']
            ))
            return False  # 表示是更新，不是新增
        else:
            # 插入新记录
            cursor.execute('''
                INSERT INTO browser_history 
                (url, title, visit_time, visit_count, first_visit_time, last_visit_time)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                item.url,
                item.title,
                item.visitTime,
                item.visitCount or 1,
                item.visitTime,
                item.visitTime
            ))
            return True  # 表示是新增
    except Exception as e:
        logger.error(f"插入/更新历史记录失败: {e}, URL: {item.url}")
        raise

def update_sync_stats(cursor, new_items_count: int):
    """更新同步统计信息"""
    try:
        # 检查是否已有统计记录
        cursor.execute('SELECT id, total_synced, sync_count FROM sync_stats LIMIT 1')
        stats = cursor.fetchone()
        
        if stats:
            cursor.execute('''
                UPDATE sync_stats 
                SET total_synced = total_synced + ?,
                    sync_count = sync_count + 1,
                    last_sync_time = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (new_items_count, stats['id']))
        else:
            cursor.execute('''
                INSERT INTO sync_stats (total_synced, sync_count, last_sync_time)
                VALUES (?, 1, CURRENT_TIMESTAMP)
            ''', (new_items_count,))
    except Exception as e:
        logger.error(f"更新同步统计失败: {e}")

# Web界面路由
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """Web管理界面首页"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/ai", response_class=HTMLResponse)
async def ai_config_page(request: Request):
    """AI配置管理页面（简化版）"""
    return templates.TemplateResponse("ai_simple.html", {"request": request})

@app.get("/ai-advanced", response_class=HTMLResponse)
async def ai_config_advanced_page(request: Request):
    """AI配置管理页面（高级版）"""
    return templates.TemplateResponse("ai_config.html", {"request": request})

@app.get("/agents", response_class=HTMLResponse)
async def agents_hub_page(request: Request):
    """AI Agent工作台"""
    return templates.TemplateResponse("agents_hub.html", {"request": request})

# API端点
@app.get("/api", response_model=ApiResponse)
async def api_root():
    """API根路径"""
    return ApiResponse(
        success=True,
        message="浏览器历史记录API服务运行中",
        data={
            "version": "1.0.0",
            "endpoints": ["/api/sync-single", "/api/sync-batch", "/api/stats", "/api/history"]
        }
    )

@app.post("/api/sync-single", response_model=ApiResponse)
async def sync_single_item(item: HistoryItem):
    """同步单条历史记录"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            is_new = insert_or_update_history_item(cursor, item)
            
            if is_new:
                update_sync_stats(cursor, 1)
            
            conn.commit()
            
            return ApiResponse(
                success=True,
                message="单条记录同步成功" if is_new else "记录已存在，已更新",
                data={"is_new": is_new, "url": item.url}
            )
    except Exception as e:
        logger.error(f"同步单条记录失败: {e}")
        raise HTTPException(status_code=500, detail=f"同步失败: {str(e)}")

@app.post("/api/sync-batch", response_model=ApiResponse)
async def sync_batch_items(batch: HistoryBatch):
    """批量同步历史记录"""
    try:
        logger.info(f"接收到批量同步请求，包含 {len(batch.items)} 条记录")
        
        # 验证数据
        if not batch.items:
            raise HTTPException(status_code=400, detail="批量数据不能为空")
        
        new_items_count = 0
        updated_items_count = 0
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            for item in batch.items:
                is_new = insert_or_update_history_item(cursor, item)
                if is_new:
                    new_items_count += 1
                else:
                    updated_items_count += 1
            
            # 更新统计信息
            if new_items_count > 0:
                update_sync_stats(cursor, new_items_count)
            
            conn.commit()
            
            return ApiResponse(
                success=True,
                message=f"批量同步完成: 新增 {new_items_count} 条，更新 {updated_items_count} 条",
                data={
                    "total_processed": len(batch.items),
                    "new_items": new_items_count,
                    "updated_items": updated_items_count
                }
            )
    except Exception as e:
        logger.error(f"批量同步失败: {e}")
        raise HTTPException(status_code=500, detail=f"批量同步失败: {str(e)}")

@app.get("/api/stats", response_model=ApiResponse)
async def get_stats():
    """获取同步统计信息"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # 获取总体统计
            cursor.execute('''
                SELECT 
                    COUNT(*) as total_records,
                    COUNT(DISTINCT url) as unique_urls,
                    MIN(visit_time) as earliest_visit,
                    MAX(visit_time) as latest_visit
                FROM browser_history
            ''')
            general_stats = cursor.fetchone()
            
            # 获取同步统计
            cursor.execute('''
                SELECT total_synced, sync_count, last_sync_time
                FROM sync_stats
                ORDER BY id DESC
                LIMIT 1
            ''')
            sync_stats = cursor.fetchone()
            
            return ApiResponse(
                success=True,
                message="统计信息获取成功",
                data={
                    "total_records": general_stats['total_records'],
                    "unique_urls": general_stats['unique_urls'],
                    "earliest_visit": general_stats['earliest_visit'],
                    "latest_visit": general_stats['latest_visit'],
                    "total_synced": sync_stats['total_synced'] if sync_stats else 0,
                    "sync_count": sync_stats['sync_count'] if sync_stats else 0,
                    "last_sync_time": sync_stats['last_sync_time'] if sync_stats else None
                }
            )
    except Exception as e:
        logger.error(f"获取统计信息失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取统计信息失败: {str(e)}")

@app.get("/api/history")
async def get_history(limit: int = 100, offset: int = 0, search: Optional[str] = None):
    """获取历史记录列表"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # 构建查询条件
            where_clause = ""
            params = []
            
            if search:
                where_clause = "WHERE url LIKE ? OR title LIKE ?"
                params.extend([f"%{search}%", f"%{search}%"])
            
            # 查询历史记录
            query = f'''
                SELECT url, title, visit_time, visit_count, first_visit_time, last_visit_time
                FROM browser_history
                {where_clause}
                ORDER BY last_visit_time DESC
                LIMIT ? OFFSET ?
            '''
            params.extend([limit, offset])
            
            cursor.execute(query, params)
            records = cursor.fetchall()
            
            # 转换为字典列表
            history_list = []
            for record in records:
                history_list.append({
                    "url": record['url'],
                    "title": record['title'],
                    "visitTime": record['visit_time'],
                    "visitCount": record['visit_count'],
                    "firstVisitTime": record['first_visit_time'],
                    "lastVisitTime": record['last_visit_time']
                })
            
            return ApiResponse(
                success=True,
                message=f"获取到 {len(history_list)} 条历史记录",
                data={
                    "records": history_list,
                    "limit": limit,
                    "offset": offset,
                    "search": search
                }
            )
    except Exception as e:
        logger.error(f"获取历史记录失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取历史记录失败: {str(e)}")

@app.get("/api/analytics/daily-visits")
async def get_daily_visits():
    """获取每日访问统计"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # 获取最近7天的访问统计
            cursor.execute('''
                SELECT DATE(visit_time/1000, 'unixepoch', 'localtime') as date,
                       COUNT(*) as visits
                FROM browser_history 
                WHERE visit_time >= ? 
                GROUP BY DATE(visit_time/1000, 'unixepoch', 'localtime')
                ORDER BY date
                LIMIT 7
            ''', (int((datetime.datetime.now() - datetime.timedelta(days=7)).timestamp() * 1000),))
            
            result = cursor.fetchall()
            daily_visits = [{"date": row['date'], "visits": row['visits']} for row in result]
            
            return ApiResponse(
                success=True,
                message="获取每日访问统计成功",
                data={"daily_visits": daily_visits}
            )
    except Exception as e:
        logger.error(f"获取每日访问统计失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取每日访问统计失败: {str(e)}")

@app.get("/api/analytics/top-sites")
async def get_top_sites(limit: int = 10):
    """获取热门网站统计"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT 
                    CASE 
                        WHEN url LIKE 'https://%' THEN SUBSTR(url, 9)
                        WHEN url LIKE 'http://%' THEN SUBSTR(url, 8)
                        ELSE url
                    END as temp_url,
                    COUNT(*) as visit_count,
                    SUM(visit_count) as total_visits
                FROM browser_history 
                WHERE url LIKE 'http%'
                GROUP BY temp_url
                ORDER BY visit_count DESC
                LIMIT ?
            ''', (limit,))
            
            result = cursor.fetchall()
            top_sites = []
            for row in result:
                temp_url = row['temp_url']
                domain = temp_url.split('/')[0].replace('www.', '') if '/' in temp_url else temp_url.replace('www.', '')
                top_sites.append({
                    "domain": domain,
                    "visit_count": row['visit_count'],
                    "total_visits": row['total_visits']
                })
            
            return ApiResponse(
                success=True,
                message="获取热门网站统计成功",
                data={"top_sites": top_sites}
            )
    except Exception as e:
        logger.error(f"获取热门网站统计失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取热门网站统计失败: {str(e)}")

@app.delete("/api/clear-all")
async def clear_all_data():
    """清空所有历史记录数据"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # 清空历史记录表
            cursor.execute('DELETE FROM browser_history')
            
            # 重置同步统计
            cursor.execute('DELETE FROM sync_stats')
            
            conn.commit()
            
            return ApiResponse(
                success=True,
                message="所有数据已清空",
                data={"deleted_records": cursor.rowcount}
            )
    except Exception as e:
        logger.error(f"清空数据失败: {e}")
        raise HTTPException(status_code=500, detail=f"清空数据失败: {str(e)}")

# AI配置管理API
@app.get("/api/ai/configs")
async def get_ai_configs():
    """获取所有AI配置"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT name, type, base_url, model, max_tokens, temperature, is_active
                FROM ai_configs 
                ORDER BY created_at DESC
            ''')
            configs = []
            for row in cursor.fetchall():
                configs.append({
                    "name": row['name'],
                    "type": row['type'],
                    "base_url": row['base_url'],
                    "model": row['model'],
                    "max_tokens": row['max_tokens'],
                    "temperature": row['temperature'],
                    "is_active": bool(row['is_active'])
                })
            
            return ApiResponse(
                success=True,
                message="获取AI配置成功",
                data={"configs": configs}
            )
    except Exception as e:
        logger.error(f"获取AI配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取AI配置失败: {str(e)}")

@app.post("/api/ai/configs")
async def create_ai_config(config: AIConfig):
    """创建AI配置"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO ai_configs 
                (name, type, base_url, api_key, model, max_tokens, temperature, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (config.name, config.type, config.base_url, config.api_key, 
                  config.model, config.max_tokens, config.temperature, config.is_active))
            conn.commit()
            
            return ApiResponse(
                success=True,
                message=f"AI配置 '{config.name}' 创建成功",
                data={"config_name": config.name}
            )
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail=f"配置名称 '{config.name}' 已存在")
    except Exception as e:
        logger.error(f"创建AI配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"创建AI配置失败: {str(e)}")

@app.put("/api/ai/configs/{config_name}")
async def update_ai_config(config_name: str, config: AIConfig):
    """更新AI配置"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE ai_configs 
                SET type=?, base_url=?, api_key=?, model=?, max_tokens=?, temperature=?, 
                    is_active=?, updated_at=CURRENT_TIMESTAMP
                WHERE name=?
            ''', (config.type, config.base_url, config.api_key, config.model,
                  config.max_tokens, config.temperature, config.is_active, config_name))
            
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail=f"配置 '{config_name}' 不存在")
            
            conn.commit()
            return ApiResponse(
                success=True,
                message=f"AI配置 '{config_name}' 更新成功",
                data={"config_name": config_name}
            )
    except Exception as e:
        logger.error(f"更新AI配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"更新AI配置失败: {str(e)}")

@app.delete("/api/ai/configs/{config_name}")
async def delete_ai_config(config_name: str):
    """删除AI配置"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM ai_configs WHERE name=?', (config_name,))
            
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail=f"配置 '{config_name}' 不存在")
            
            conn.commit()
            return ApiResponse(
                success=True,
                message=f"AI配置 '{config_name}' 删除成功",
                data={"config_name": config_name}
            )
    except Exception as e:
        logger.error(f"删除AI配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"删除AI配置失败: {str(e)}")

@app.post("/api/ai/test-ollama")
async def test_ollama_connection(request: OllamaTestRequest):
    """测试Ollama连接"""
    try:
        async with aiohttp.ClientSession() as session:
            # 测试连接
            health_url = f"{request.base_url.rstrip('/')}/api/tags"
            async with session.get(health_url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status != 200:
                    raise HTTPException(status_code=400, detail=f"Ollama服务连接失败: HTTP {response.status}")
                
                data = await response.json()
                models = [model['name'] for model in data.get('models', [])]
                
                # 测试具体模型
                if request.model and request.model in models:
                    test_url = f"{request.base_url.rstrip('/')}/api/generate"
                    test_data = {
                        "model": request.model,
                        "prompt": "Hello",
                        "stream": False
                    }
                    
                    async with session.post(test_url, json=test_data, 
                                          timeout=aiohttp.ClientTimeout(total=30)) as test_response:
                        if test_response.status == 200:
                            test_result = await test_response.json()
                            return ApiResponse(
                                success=True,
                                message="Ollama连接测试成功",
                                data={
                                    "status": "connected",
                                    "available_models": models,
                                    "tested_model": request.model,
                                    "test_response": test_result.get('response', '')[:100] + "..."
                                }
                            )
                
                return ApiResponse(
                    success=True,
                    message="Ollama服务连接成功",
                    data={
                        "status": "connected",
                        "available_models": models,
                        "note": f"模型 '{request.model}' 未找到" if request.model else "未测试具体模型"
                    }
                )
                
    except aiohttp.ClientError as e:
        raise HTTPException(status_code=400, detail=f"连接Ollama失败: {str(e)}")
    except Exception as e:
        logger.error(f"测试Ollama连接失败: {e}")
        raise HTTPException(status_code=500, detail=f"测试连接失败: {str(e)}")

@app.post("/api/ai/test")
async def test_ai_model(request: AITestRequest):
    """测试AI模型"""
    try:
        # 获取配置
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT type, base_url, api_key, model, max_tokens, temperature
                FROM ai_configs WHERE name=? AND is_active=1
            ''', (request.config_name,))
            config_row = cursor.fetchone()
            
            if not config_row:
                raise HTTPException(status_code=404, detail=f"AI配置 '{request.config_name}' 不存在或未激活")
        
        config = {
            'type': config_row['type'],
            'base_url': config_row['base_url'],
            'api_key': config_row['api_key'],
            'model': config_row['model'],
            'max_tokens': config_row['max_tokens'],
            'temperature': config_row['temperature']
        }
        
        # 根据类型测试不同的AI服务
        if config['type'] == 'ollama':
            response_text = await test_ollama_model(config, request.prompt)
        else:
            raise HTTPException(status_code=400, detail=f"暂不支持 '{config['type']}' 类型的AI服务")
        
        return ApiResponse(
            success=True,
            message="AI模型测试成功",
            data={
                "config_name": request.config_name,
                "prompt": request.prompt,
                "response": response_text,
                "model": config['model']
            }
        )
        
    except Exception as e:
        logger.error(f"测试AI模型失败: {e}")
        raise HTTPException(status_code=500, detail=f"测试AI模型失败: {str(e)}")

async def test_ollama_model(config: dict, prompt: str) -> str:
    """测试Ollama模型"""
    try:
        async with aiohttp.ClientSession() as session:
            url = f"{config['base_url'].rstrip('/')}/api/generate"
            data = {
                "model": config['model'],
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": config.get('max_tokens', 512),
                    "temperature": config.get('temperature', 0.7)
                }
            }
            
            logger.info(f"发送Ollama请求到: {url}")
            logger.info(f"请求数据: {data}")
            
            async with session.post(url, json=data, 
                                  timeout=aiohttp.ClientTimeout(total=60)) as response:
                response_text = await response.text()
                logger.info(f"Ollama响应状态: {response.status}")
                logger.info(f"Ollama响应内容: {response_text[:200]}...")
                
                if response.status != 200:
                    raise Exception(f"Ollama API请求失败: HTTP {response.status} - {response_text}")
                
                result = await response.json()
                return result.get('response', '无响应内容')
                
    except aiohttp.ClientError as e:
        logger.error(f"Ollama客户端错误: {e}")
        raise Exception(f"无法连接到Ollama服务: {str(e)}")
    except Exception as e:
        logger.error(f"Ollama测试失败: {e}")
        raise Exception(str(e))

# Agent模板管理API
@app.get("/api/ai/agents")
async def get_agent_templates():
    """获取所有Agent模板"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT name, description, system_prompt, user_prompt_template, 
                       ai_config, is_active
                FROM agent_templates 
                ORDER BY created_at DESC
            ''')
            templates = []
            for row in cursor.fetchall():
                templates.append({
                    "name": row['name'],
                    "description": row['description'],
                    "system_prompt": row['system_prompt'],
                    "user_prompt_template": row['user_prompt_template'],
                    "ai_config": row['ai_config'],
                    "is_active": bool(row['is_active'])
                })
            
            return ApiResponse(
                success=True,
                message="获取Agent模板成功",
                data={"templates": templates}
            )
    except Exception as e:
        logger.error(f"获取Agent模板失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取Agent模板失败: {str(e)}")

@app.post("/api/ai/agents")
async def create_agent_template(template: AgentTemplate):
    """创建Agent模板"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO agent_templates 
                (name, description, system_prompt, user_prompt_template, ai_config, is_active)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (template.name, template.description, template.system_prompt, 
                  template.user_prompt_template, template.ai_config, template.is_active))
            conn.commit()
            
            return ApiResponse(
                success=True,
                message=f"Agent模板 '{template.name}' 创建成功",
                data={"template_name": template.name}
            )
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail=f"模板名称 '{template.name}' 已存在")
    except Exception as e:
        logger.error(f"创建Agent模板失败: {e}")
        raise HTTPException(status_code=500, detail=f"创建Agent模板失败: {str(e)}")

# 应用启动时初始化数据库
@app.on_event("startup")
async def startup_event():
    """应用启动事件"""
    logger.info("正在启动浏览器历史记录API服务...")
    init_database()
    logger.info("API服务启动完成，可以接收请求")

if __name__ == "__main__":
    print("🚀 启动浏览器历史记录本地API服务")
    print("📊 服务地址: http://localhost:8000")
    print("📚 API文档: http://localhost:8000/docs")
    print("📈 ReDoc文档: http://localhost:8000/redoc")
    print("=" * 50)
    
    uvicorn.run(
        "server:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )