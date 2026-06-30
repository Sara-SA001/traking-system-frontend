'use client';

import Link from 'next/link';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';

export function AuthShell({
  title,
  subtitle,
  children,
}: Readonly<{
  title: string;
  subtitle: string;
  children: React.ReactNode;
}>) {
  return (
    <div className="page-shell flex items-center justify-center">
      <div className="page-wrap grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="glass-card hidden overflow-hidden rounded-[2rem] p-8 lg:block">
          <Badge>Academic Attendance System</Badge>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-slate-900">واجهة عربية نظيفة لإدارة الحضور الجامعي</h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-slate-600">
            تسجيل دخول سريع، لوحات تحكم منفصلة، وحضور عبر QR أو الإدخال اليدوي في تجربة واحدة متناسقة.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-slate-700">
            <div className="rounded-2xl bg-white/80 p-4">دعم الأدوار: ADMIN, TEACHER, STUDENT</div>
            <div className="rounded-2xl bg-white/80 p-4">Dashboard منفصل للمدرس والإدمن</div>
            <div className="rounded-2xl bg-white/80 p-4">تصميم RTL جاهز ومتجاوب</div>
          </div>
        </section>

        <Card className="rounded-[2rem] border-slate-200/70 bg-white/90 shadow-xl">
          <CardHeader className="space-y-2">
            <Badge variant="secondary">Tracking System</Badge>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription className="text-sm leading-7">{subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {children}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50" href="/login">
                Login
              </Link>
              <Link className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50" href="/register">
                Register
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
