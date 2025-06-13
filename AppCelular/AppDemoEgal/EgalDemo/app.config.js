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
            "host": "172.22.82.26",
            "pathPrefix": "/puertas/v1/abrir"
          },
          {
            "scheme": "https",
            "host": "172.22.82.26",
            "pathPrefix": "/puertas/v1/abrir"
          }
        ],
        "category": ["BROWSABLE", "DEFAULT"]
      }
    ]
  },
  "ios": {
    "associatedDomains": ["applinks:172.22.82.26"]
  }
}