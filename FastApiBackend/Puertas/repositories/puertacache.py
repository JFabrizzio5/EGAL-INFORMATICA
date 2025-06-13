from typing import Dict, Set, Optional, Tuple
import time
import json
from config import get_redis, logger

class PuertaCacheRepository:
    """Repositorio para manejar caché de permisos de puertas en Redis"""
    
    @staticmethod
    async def get_cached_permission(user_id: str, puerta_id: str) -> Optional[bool]:
        """
        Obtiene el permiso cacheado para un usuario y puerta específicos
        
        Args:
            user_id: ID del usuario
            puerta_id: ID de la puerta
            
        Returns:
            Optional[bool]: True si tiene permiso, False si no tiene, None si no está en caché
        """
        try:
            redis_client = await get_redis()
            cache_key = f"puerta:permisos:{user_id}:{puerta_id}"
            
            # Verificar si existe en caché
            cached_value = await redis_client.get(cache_key)
            await redis_client.close()
            
            if cached_value is None:
                return None
                
            return cached_value == "1"
            
        except Exception as e:
            logger.error(f"Error obteniendo permiso cacheado: {e}")
            # Si hay error, continuamos sin caché
            return None
    
    @staticmethod
    async def set_permission_cache(user_id: str, puerta_id: str, has_permission: bool, ttl_seconds: int = 300) -> bool:
        """
        Guarda el permiso en caché
        
        Args:
            user_id: ID del usuario
            puerta_id: ID de la puerta
            has_permission: Si tiene permiso o no
            ttl_seconds: Tiempo de vida en segundos (default: 5 minutos)
            
        Returns:
            bool: True si se guardó correctamente
        """
        try:
            redis_client = await get_redis()
            cache_key = f"puerta:permisos:{user_id}:{puerta_id}"
            
            # Guardar valor en caché (1 = tiene permiso, 0 = no tiene)
            value = "1" if has_permission else "0"
            await redis_client.set(cache_key, value, ex=ttl_seconds)
            await redis_client.close()
            
            return True
            
        except Exception as e:
            logger.error(f"Error guardando permiso en caché: {e}")
            return False
    
    @staticmethod
    async def invalidate_user_cache(user_id: str) -> bool:
        """
        Invalida toda la caché de permisos para un usuario
        
        Args:
            user_id: ID del usuario
            
        Returns:
            bool: True si se invalidó correctamente
        """
        try:
            redis_client = await get_redis()
            pattern = f"puerta:permisos:{user_id}:*"
            
            # Obtener todas las claves que coinciden con el patrón
            keys = await redis_client.keys(pattern)
            
            if keys:
                # Eliminar todas las claves encontradas
                await redis_client.delete(*keys)
                
            await redis_client.close()
            logger.info(f"Caché de permisos invalidada para usuario {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error invalidando caché de permisos: {e}")
            return False
    
    @staticmethod
    async def log_puerta_access(user_id: str, puerta_id: str, action: str, status: str) -> bool:
        """
        Registra acceso a puerta en Redis para análisis en tiempo real
        
        Args:
            user_id: ID del usuario
            puerta_id: ID de la puerta
            action: Acción realizada (abrir, cerrar)
            status: Estado (success, denied, error)
            
        Returns:
            bool: True si se registró correctamente
        """
        try:
            redis_client = await get_redis()
            
            # Crear clave con estructura para series temporales
            timestamp = int(time.time())
            log_key = f"puerta:logs:{timestamp}"
            
            # Datos del log
            log_data = {
                "user_id": user_id,
                "puerta_id": puerta_id,
                "action": action,
                "status": status,
                "timestamp": timestamp
            }
            
            # Guardar como JSON con TTL de 24 horas
            await redis_client.set(log_key, json.dumps(log_data), ex=86400)
            
            # Añadir a la lista de accesos recientes (limitada a 100 elementos)
            await redis_client.lpush("puerta:logs:recent", json.dumps(log_data))
            await redis_client.ltrim("puerta:logs:recent", 0, 99)
            
            await redis_client.close()
            return True
            
        except Exception as e:
            logger.error(f"Error registrando acceso a puerta en Redis: {e}")
            return False