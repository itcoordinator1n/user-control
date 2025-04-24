"use client"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { loginSchema } from "@/lib/zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

import { signIn, useSession, signOut } from "next-auth/react";
import { useState } from "react";
//import { useRouter } from "next/router";



const FormLogin = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const { data: session, status } = useSession();
    //const router = useRouter();

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            user: "",
            password: "",
        },
    });


    async function onSubmit(values: z.infer<typeof loginSchema>) {

        const result = await signIn("credentials", {
            redirect: false,
            username: values.user,
            password: values.password,
        });
        // Si el inicio de sesión es exitoso, redirige a /dashboard
        if (result?.ok) {
            //router.push("/dashboard");
        } else {
            alert("Invalid credentials");
        }
    }


    return (
        <div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                        control={form.control}
                        name="user"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Usuario</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="user"
                                        type="text"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Ingresa tu usuario.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"

                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contraseña</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Contraseña"
                                        type="password" {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Ingresa tu contraseña.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit">Submit</Button>
                </form>
            </Form>
            <Button type="button" onClick={async () => {
                await signOut({ callbackUrl: "/login" });
            }}>logout</Button>
        </div>

    )
}

export default FormLogin