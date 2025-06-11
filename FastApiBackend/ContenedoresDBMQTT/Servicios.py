import subprocess

SERVICES = {
    "mosquitto": "mosquitto/docker-compose.yml",
    "redis": "redis/docker-compose.yml",
    "mongo": "mongo/docker-compose.yml"
}

def run_compose(service, command):
    compose_file = SERVICES.get(service)
    if not compose_file:
        print(f"❌ Servicio '{service}' no reconocido.")
        return

    try:
        subprocess.run(
            ["docker-compose", "-f", compose_file] + command,
            check=True
        )
        print(f"✅ Servicio '{service}' ejecutado con comando: {' '.join(command)}")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error al ejecutar '{service}': {e}")

def run_all(command):
    for service in SERVICES:
        run_compose(service, command)

def menu():
    print("\n🛠️  Gestor de Contenedores Docker")
    print("1. Arrancar servicio")
    print("2. Detener servicio")
    print("3. Ver estado de servicio")
    print("4. Arrancar todos")
    print("5. Detener todos")
    print("6. Ver estado de todos")
    print("7. Salir")
    
    choice = input("Selecciona una opción: ").strip()

    if choice == "1":
        service = input("Ingresa servicio (mosquitto, redis, mongo): ").strip()
        run_compose(service, ["up", "-d"])
    elif choice == "2":
        service = input("Ingresa servicio (mosquitto, redis, mongo): ").strip()
        run_compose(service, ["down"])
    elif choice == "3":
        service = input("Ingresa servicio (mosquitto, redis, mongo): ").strip()
        run_compose(service, ["ps"])
    elif choice == "4":
        run_all(["up", "-d"])
    elif choice == "5":
        run_all(["down"])
    elif choice == "6":
        run_all(["ps"])
    elif choice == "7":
        print("👋 Saliendo...")
        exit()
    else:
        print("❌ Opción inválida.")

if __name__ == "__main__":
    while True:
        menu()
