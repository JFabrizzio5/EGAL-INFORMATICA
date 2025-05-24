# Dockerfile
FROM node:20

# Instala expo-cli
RUN npm install -g expo-cli

# Crea carpeta de la app
WORKDIR /EgalApp

# Copia los archivos del proyecto
COPY . .

# Instala las dependencias del proyecto
RUN npm install

# Expone el puerto 19000 (Expo)
EXPOSE 19000

# Comando por defecto
CMD ["npx", "expo", "start", "--tunnel"]
