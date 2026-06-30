"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CircleAlert, Loader2, Mail, Lock } from "lucide-react";
import { AuthShell } from "../auth-shell";
import api, {
  setAuthSession,
  getApiErrorMessage,
  clearAuthSession,
} from "../../../lib/axios";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import type { LoginFormValues } from "../../../types";

const loginSchema = z.object({
  email: z.string().email("أدخل بريدًا إلكترونيًا صحيحًا"),
  password: z.string().min(6, "كلمة المرور مطلوبة"),
});

export default function LoginPage() {
  const router = useRouter();
  const [nextRoute, setNextRoute] = useState<string | null>(null);
  const [error, setError] = useState("");
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    setNextRoute(new URLSearchParams(window.location.search).get("next"));
  }, []);

  const onSubmit = form.handleSubmit(async (values) => {
    setError("");
    try {
      const { data } = await api.post("/auth/login", values);
      setAuthSession(data); // ← مهم

      const role = data.user.role;
      const redirectTo =
        role === "ADMIN"
          ? "/admin"
          : role === "TEACHER"
            ? "/teacher"
            : "/student"; // ← dashboard للطالب

      window.location.href = redirectTo; // أفضل من router.push حالياً
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "تعذر تسجيل الدخول",
      );
    }
  });

  return (
    <AuthShell
      title="تسجيل الدخول"
      subtitle="ادخل إلى لوحة التحكم المناسبة حسب دورك في النظام."
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        {error ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <CircleAlert className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              id="email"
              type="email"
              className="pr-10"
              placeholder="name@example.com"
              {...form.register("email")}
            />
          </div>
          {form.formState.errors.email ? (
            <p className="text-sm text-red-600">
              {form.formState.errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">كلمة المرور</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              id="password"
              type="password"
              className="pr-10"
              placeholder="••••••••"
              {...form.register("password")}
            />
          </div>
          {form.formState.errors.password ? (
            <p className="text-sm text-red-600">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>

        <Button
          className="w-full"
          type="submit"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          دخول
        </Button>

        <div className="flex items-center justify-between text-sm text-slate-600">
          <a
            className="inline-flex items-center gap-1 hover:text-slate-900"
            href="/register"
          >
            <ArrowLeft className="h-4 w-4" />
            إنشاء حساب جديد
          </a>
          <span>ADMIN / TEACHER / STUDENT</span>
        </div>
      </form>
    </AuthShell>
  );
}
