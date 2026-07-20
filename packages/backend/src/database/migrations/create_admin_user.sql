-- Inserta el usuario administrador con el hash bcrypt correcto.
-- Ejecutar vía docker cp + psql -f para evitar que PowerShell
-- interprete los signos $ del hash bcrypt como variables.

DELETE FROM stylist_users WHERE email = 'rosi@rosisalon.com';

INSERT INTO stylist_users (email, password_hash)
VALUES ('rosi@rosisalon.com', '$2b$12$5jKaz0t/ucWD6dvZhbYW3umsU.Iuie/FTFhgKuXn53shyR5vu4/Zi');

SELECT email, password_hash FROM stylist_users WHERE email = 'rosi@rosisalon.com';
