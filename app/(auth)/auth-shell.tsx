"use client";

import Link from "next/link";
import { Badge } from "../../components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

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
      <div className="page-wrap w-full max-w-3xl">
        <Card className="rounded-[2rem] border-slate-200/70 bg-white/90 shadow-xl">
          <CardHeader className="space-y-2">
            <Badge variant="secondary">Tracking System</Badge>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription className="text-sm leading-7">
              {subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {children}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                href="/login"
              >
                Login
              </Link>
              <Link
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                href="/register"
              >
                Register
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
