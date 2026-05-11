

interface Usuario {
    id_usuario: number;
    id_pais: number;
    txt_nombre: string;
    txt_usuario: string;
    txt_correo_electronico: string;
    txt_numero_telefonico: string;
    bln_activo: boolean;
    permissions: string[]; // Mantenemos para compatibilidad
    platforms: string[];
    platformPermissions: Record<string, string[]>;
}

interface Data {
    token: string;
    user:Usuario;
}

export type { Usuario, Data }