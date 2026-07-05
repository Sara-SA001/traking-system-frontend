"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { getApiErrorMessage } from "../../lib/axios";
import { LogoutButton } from "../../components/logout-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { User, Clock, QrCode, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function StudentPage() {
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [qrCode, setQrCode] = useState<string>("");
  const [qrLoading, setQrLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== "STUDENT") {
      router.push(user.role === "ADMIN" ? "/admin" : "/teacher");
      return;
    }

    loadStudentData(user.id || user.student?.id);
  }, [router]);

  async function loadStudentData(userId: string) {
    setLoading(true);
    try {
      const studentRes = await api.get(`/students/me`);
      setStudent(studentRes.data);

      const attendanceRes = await api.get(
        `/attendance/student/${studentRes.data.id}`,
      );
      setAttendance(attendanceRes.data);
    } catch (error) {
      toast.error("تعذر تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }

  async function generateMyQr() {
    if (!student?.id && !student?.studentId) {
      toast.error("رقم الطالب غير متوفر");
      return;
    }

    setQrLoading(true);
    try {
      // Use the DB `id` (preferred). Backend accepts student DB id.
      const targetId = student.id ?? student.studentId;
      const { data } = await api.get(`/qr/student/${targetId}`);
      setQrCode(data.qrCode ?? data.qr);
      toast.success("تم توليد QR Code بنجاح");
    } catch (error: any) {
      console.error('QR generation failed', error);
      toast.error(getApiErrorMessage(error) ?? "فشل توليد QR Code");
    } finally {
      setQrLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">لوحة الطالب</h1>
            <p className="text-gray-600 mt-1">مرحباً، {student?.fullName}</p>
          </div>
          <LogoutButton />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                معلوماتي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>رقم الطالب:</strong> {student?.studentId || "غير محدد"}
              </p>
              <p>
                <strong>التخصص:</strong> {student?.major || "غير محدد"}
              </p>
              <p>
                <strong>الفصل:</strong> {student?.semester || "غير محدد"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                حضوري
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600">
                {attendance.length}
              </p>
              <p className="text-sm text-gray-500">جلسة</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الحالة</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="success" className="text-sm">
                طالب نشط
              </Badge>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 mt-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code الخاص بي
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={generateMyQr}
                disabled={qrLoading}
                className="mb-4"
              >
                {qrLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "توليد QR Code"
                )}
              </Button>

              {qrCode && (
                <img
                  src={qrCode}
                  alt="QR Code"
                  className="mx-auto border p-4 rounded-2xl bg-white shadow"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>سجل الحضور</CardTitle>
            </CardHeader>
            <CardContent>
              {attendance.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  سيظهر سجل حضورك هنا
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الشعبة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الوقت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {new Date(record.createdAt).toLocaleDateString(
                            "ar-SA",
                          )}
                        </TableCell>
                        <TableCell>
                          {record.session?.section?.name || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              record.status === "PRESENT"
                                ? "success"
                                : "secondary"
                            }
                          >
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {record.arrivalTime
                            ? new Date(record.arrivalTime).toLocaleTimeString(
                                "ar-SA",
                              )
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
