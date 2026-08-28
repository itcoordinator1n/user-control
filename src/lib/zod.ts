import { object, string } from "zod";

// .trim() va ANTES de las longitudes a proposito: zod aplica los checks en orden, asi
// que al reves "  abc   " pasaria el min(8) contando los espacios y se enviaria una
// contrasena de 3 caracteres. zodResolver devuelve el valor ya transformado, asi que el
// formulario manda lo recortado sin necesidad de tocarlo en el componente.
export const loginSchema = object({
    user: string({ required_error: "El usuario es requerido" })
        .trim()
        .min(1, "El usuario es requerido"),
    password: string({ required_error: "La contraseña es requerida" })
        .trim()
        .min(8, "La contraseña debe tener al menos 8 caracteres")
        .max(30, "La contraseña debe tener menos de 30 caracteres")
});