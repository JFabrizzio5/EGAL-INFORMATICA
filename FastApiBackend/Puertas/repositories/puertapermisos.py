from typing import List, Optional, Dict, Any
from config import get_database, logger

class PuertaPermisosRepository:
    """Repositorio para manejar permisos de puertas en MongoDB"""
    
    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        """Obtiene información de un usuario por su ID"""
        try:
            db = await get_database("egal")
            user = await db.usuarios.find_one({"_id": user_id})
            return user
        except Exception as e:
            logger.error(f"Error obteniendo usuario {user_id}: {e}")
            return None
    
    @staticmethod
    async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
        """Obtiene información de un usuario por su correo electrónico"""
        try:
            db = await get_database("egal")
            user = await db.usuarios.find_one({"email": email})
            return user
        except Exception as e:
            logger.error(f"Error obteniendo usuario con email {email}: {e}")
            return None
    
    @staticmethod
    async def check_user_permission(user_id: str, puerta_id: str) -> bool:
        """
        Verifica si un usuario tiene permiso para acceder a una puerta específica
        
        Args:
            user_id: ID del usuario
            puerta_id: ID de la puerta a verificar
        
        Returns:
            bool: True si tiene permiso, False en caso contrario
        """
        try:
            db = await get_database("egal")
            user = await db.usuarios.find_one({"_id": user_id})
            
            if not user:
                logger.warning(f"Usuario {user_id} no encontrado")
                return False
            
            # Si el usuario es admin, tiene acceso a todas las puertas
            if user.get("is_admin", False):
                logger.info(f"Usuario {user_id} es admin, acceso concedido a puerta {puerta_id}")
                return True
            
            # Verificar si la puerta está en la lista de puertas permitidas
            puertas_permitidas = user.get("puertas_acceso", [])
            if puerta_id in puertas_permitidas:
                logger.info(f"Usuario {user_id} tiene acceso a puerta {puerta_id}")
                return True
            
            logger.warning(f"Usuario {user_id} no tiene acceso a puerta {puerta_id}")
            return False
            
        except Exception as e:
            logger.error(f"Error verificando permisos para usuario {user_id} y puerta {puerta_id}: {e}")
            # Por seguridad, ante error denegamos acceso
            return False