"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  CircleAlert,
  Loader2,
  Mail,
  UserRound,
  Lock,
} from "lucide-react";
import { AuthShell } from "../auth-shell";
import api, {
  setAuthSession,
  getApiErrorMessage,
  clearAuthSession,
} from "../../../lib/axios";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select } from "../../../components/ui/select";
import type { RegisterFormValues, Role } from "../../../types";

const registerSchema = z
  .object({
    fullName: z.string().min(3, "الاسم مطلوب"),
    email: z.string().email("أدخل بريدًا إلكترونيًا صحيحًا"),
    password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
    role: z.enum(["ADMIN", "TEACHER", "STUDENT"]),
    studentId: z.string().optional(),
    department: z.string().optional(),
    major: z.string().optional(),
    semester: z.number().optional(),
    phone: z.string().optional(),
    nationalId: z.string().optional(),
    employeeId: z.string().optional(),
  })
  .superRefine((values, context) => {
    if (values.role === "TEACHER" && !values.department) {
      context.addIssue({
        code: "custom",
        path: ["department"],
        message: "القسم مطلوب للمدرس",
      });
    }
    if (values.role === "STUDENT" && !values.studentId) {
      context.addIssue({
        code: "custom",
        path: ["studentId"],
        message: "رقم الطالب مطلوب",
      });
    }
  });

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: "STUDENT",
      studentId: "",
      department: "",
      major: "",
      semester: undefined,
      phone: "",
      nationalId: "",
      employeeId: "",
    },
  });

  const role = form.watch("role");
  const isTeacher = role === "TEACHER";
  const isStudent = role === "STUDENT";

  const helperText = useMemo(() => {
    if (isTeacher) return "ستتم إضافة بيانات القسم أثناء إنشاء الحساب.";
    if (isStudent) return "أضف رقم الطالب حتى يرتبط الحساب مباشرة بملفه.";
    return "حساب إداري عام للوصول إلى الإعدادات والتقارير.";
  }, [isStudent, isTeacher]);

  const onSubmit = form.handleSubmit(async (values) => {
    setError("");
    try {
      const payload = {
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        role: values.role,
        studentId: values.role === "STUDENT" ? values.studentId : undefined,
        department: values.role === "TEACHER" ? values.department : undefined,
        major: values.major,
        semester: values.semester,
        phone: values.phone,
        nationalId: values.nationalId,
        employeeId: values.employeeId,
      };

      const { data } = await api.post("/auth/register", payload);
      setAuthSession(data);
      router.replace(
        data.user.role === "ADMIN"
          ? "/admin"
          : data.user.role === "TEACHER"
            ? "/teacher"
            : "/dashboard",
      );
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "تعذر إنشاء الحساب",
      );
    }
  });

  return (
    <AuthShell
      title="إنشاء حساب"
      subtitle="سجّل مستخدمًا جديدًا وحدد دوره من البداية."
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        {error ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <CircleAlert className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="fullName">الاسم الكامل</Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              id="fullName"
              className="pr-10"
              placeholder="الاسم الكامل"
              {...form.register("fullName")}
            />
          </div>
          {form.formState.errors.fullName ? (
            <p className="text-sm text-red-600">
              {form.formState.errors.fullName.message}
            </p>
          ) : null}
        </div>

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
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="role">الدور</Label>
            <Select id="role" {...form.register("role")}>
              <option value="ADMIN">ADMIN</option>
              <option value="TEACHER">TEACHER</option>
              <option value="STUDENT">STUDENT</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              placeholder="05xxxxxxxx"
              {...form.register("phone")}
            />
          </div>
        </div>

        {isStudent ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="studentId">رقم الطالب</Label>
              <Input
                id="studentId"
                placeholder="ST1001"
                {...form.register("studentId")}
              />
              {form.formState.errors.studentId ? (
                <p className="text-sm text-red-600">
                  {form.formState.errors.studentId.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="major">التخصص</Label>
              <Input
                id="major"
                placeholder="Computer Science"
                {...form.register("major")}
              />
            </div>
          </div>
        ) : null}

        {isTeacher ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="department">القسم</Label>
              <Input
                id="department"
                placeholder="Software Engineering"
                {...form.register("department")}
              />
              {form.formState.errors.department ? (
                <p className="text-sm text-red-600">
                  {form.formState.errors.department.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeId">رقم الموظف</Label>
              <Input
                id="employeeId"
                placeholder="TCH1001"
                {...form.register("employeeId")}
              />
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {helperText}
        </div>

        <Button
          className="w-full"
          type="submit"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          إنشاء الحساب
        </Button>

        <a
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          href="/login"
        >
          <ArrowLeft className="h-4 w-4" />
          العودة إلى تسجيل الدخول
        </a>
      </form>
    </AuthShell>
  );
}
