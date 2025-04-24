import { object, string } from "zod";

export const loginSchema = object({
    user: string({ required_error: "El usuario es requerido" })
        .min(1, "El email es requerido"),
    password: string({ required_error: "La contraseña es requerida" })
        .min(8, "La contraseña debe tener al menos 8 caracteres")
        .max(30, "La contraseña debe tener menos de 30 caracteres")
});