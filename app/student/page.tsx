"use client";

import { useEffect, useState } from "react";
import api from "../../lib/axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { LogoutButton } from "../../components/logout-button";

export default function StudentPage() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/attendance/me") // أو endpoint مناسب
      .then((res) => setAttendance(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Badge>Student Dashboard</Badge>
          <h1 className="text-3xl font-bold mt-2">حضوري</h1>
        </div>
        <LogoutButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>سجل الحضور</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            "جاري التحميل..."
          ) : (
            <p>سيظهر سجل حضورك هنا (نكمله لاحقاً)</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
