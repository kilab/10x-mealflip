-- Inicjalizacja bazy danych dla środowiska development
-- Ten plik zostanie wykonany przy pierwszym uruchomieniu kontenera PostgreSQL

-- Utworzenie użytkownika dla aplikacji (opcjonalne dla dev)
-- CREATE USER mealflip_app WITH PASSWORD 'dev_password';
-- GRANT ALL PRIVILEGES ON DATABASE mealflip_dev TO mealflip_app;

-- Ustawienia dla development
ALTER DATABASE mealflip_dev SET timezone = 'UTC';

-- Informacja o inicjalizacji
DO $$
BEGIN
    RAISE NOTICE 'Baza danych mealflip_dev została zainicjalizowana pomyślnie';
END
$$;
