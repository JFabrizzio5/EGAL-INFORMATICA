export default {
  // Resto de tu configuración...
  
  "scheme": "egaldemo",
  "android": {
    "intentFilters": [
      {
        "action": "VIEW",
        "autoVerify": true,
        "data": [
          {
            "scheme": "http",
            "host": "192.168.1.160",
            "pathPrefix": "/puertas/v1/abrir"
          },
          {
            "scheme": "https",
            "host": "192.168.1.160",
            "pathPrefix": "/puertas/v1/abrir"
          }
        ],
        "category": ["BROWSABLE", "DEFAULT"]
      }
    ]
  },
  "ios": {
    "associatedDomains": ["applinks:192.168.1.160"]
  }
}