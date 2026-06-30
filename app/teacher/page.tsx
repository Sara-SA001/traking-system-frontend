"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Camera,
  CheckCircle2,
  Clock3,
  Loader2,
  PlusCircle,
  QrCode,
  ScanLine,
  SendHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import api, {
  setAuthSession,
  getApiErrorMessage,
  clearAuthSession,
} from "../../lib/axios";
import { LogoutButton } from "../../components/logout-button";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Separator } from "../../components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Textarea } from "../../components/ui/textarea";

type StudentItem = { id: string; studentId: string; fullName: string };
type SectionItem = {
  id: string;
  name: string;
  semester?: string;
  academicYear?: string;
  room?: string;
  courseSections?: Array<{ course?: { name?: string; code?: string } }>;
  sectionTeachers?: Array<{ teacher?: { user?: { fullName?: string } } }>;
  enrollments?: Array<{ student: StudentItem }>;
  _count?: { enrollments?: number };
};
type SessionItem = {
  id: string;
  title: string;
  isActive?: boolean;
  startTime?: string;
  endTime?: string;
  attendances?: Array<{ id: string }>;
};
type AttendanceItem = {
  id: string;
  status: "PRESENT" | "LATE" | "ABSENT";
  arrivalTime?: string;
  student?: StudentItem;
};
type QrResponse = { qrCode: string; fullName: string; studentId: string };

const sessionSchema = z.object({
  title: z.string().min(3, "العنوان مطلوب"),
});

const attendanceSchema = z.object({
  sessionId: z.string().min(1, "اختر جلسة"),
  studentId: z.string().min(1, "رقم الطالب مطلوب"),
  arrivalTime: z.string().optional(),
  notes: z.string().optional(),
});

export default function TeacherPage() {
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [sectionsError, setSectionsError] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [attendanceToday, setAttendanceToday] = useState<AttendanceItem[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [qrImage, setQrImage] = useState("");
  const [qrPayload, setQrPayload] = useState("");
  const [qrLoading, setQrLoading] = useState(false);

  const sessionForm = useForm<{ title: string }>({
    resolver: zodResolver(sessionSchema),
    defaultValues: { title: "" },
  });

  const attendanceForm = useForm<{
    sessionId: string;
    studentId: string;
    arrivalTime?: string;
    notes?: string;
  }>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: { sessionId: "", studentId: "", arrivalTime: "", notes: "" },
  });

  const currentSection = useMemo(
    () =>
      sections.find((section) => section.id === selectedSectionId) ??
      sections[0],
    [sections, selectedSectionId],
  );

  const sectionStudents =
    currentSection?.enrollments
      ?.map((enrollment) => enrollment.student)
      .filter(Boolean) ?? [];
  const activeSession =
    sessions.find((session) => session.isActive) ?? sessions[0];
  const attendanceSessionId = attendanceForm.watch("sessionId");
  const studentIdForQr = currentSection?.enrollments?.[0]?.student?.id ?? "";

  async function loadSections() {
    setSectionsLoading(true);
    setSectionsError("");
    try {
      const { data } = await api.get<SectionItem[]>("/sections/my-sections");
      setSections(data);
      const firstId = data[0]?.id ?? "";
      setSelectedSectionId((current) => current || firstId);
      if (firstId) {
        attendanceForm.setValue("sessionId", attendanceSessionId || "");
      }
    } catch (error) {
      setSectionsError(getApiErrorMessage(error));
      toast.error("تعذر تحميل الشعب");
    } finally {
      setSectionsLoading(false);
    }
  }

  async function loadSectionDetails(sectionId: string) {
    if (!sectionId) return;
    setSessionsLoading(true);
    setAttendanceLoading(true);
    try {
      const [sessionsResponse, attendanceResponse] = await Promise.all([
        api.get<SessionItem[]>(`/sessions/section/${sectionId}`),
        api.get<AttendanceItem[]>(`/attendance/${sectionId}/today`),
      ]);
      setSessions(sessionsResponse.data);
      setAttendanceToday(attendanceResponse.data);
      const active =
        sessionsResponse.data.find((session) => session.isActive) ??
        sessionsResponse.data[0];
      attendanceForm.setValue("sessionId", active?.id ?? "");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSessionsLoading(false);
      setAttendanceLoading(false);
    }
  }

  useEffect(() => {
    loadSections();
  }, []);

  useEffect(() => {
    if (selectedSectionId) {
      loadSectionDetails(selectedSectionId);
    }
  }, [selectedSectionId]);

  useEffect(() => {
    if (!attendanceForm.getValues("sessionId") && activeSession?.id) {
      attendanceForm.setValue("sessionId", activeSession.id);
    }
  }, [activeSession?.id]);

  const createSession = sessionForm.handleSubmit(async (values) => {
    if (!selectedSectionId) return;
    try {
      await api.post("/sessions", {
        title: values.title,
        sectionId: selectedSectionId,
      });
      toast.success("تم إنشاء الجلسة");
      sessionForm.reset();
      await loadSectionDetails(selectedSectionId);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  const handleManualAttendance = attendanceForm.handleSubmit(async (values) => {
    if (!values.sessionId) {
      toast.error("اختر جلسة أولًا");
      return;
    }

    try {
      await api.post(`/attendance/${values.sessionId}/mark`, {
        studentId: values.studentId,
        arrivalTime: values.arrivalTime || new Date().toISOString(),
        notes: values.notes,
      });
      toast.success("تم تسجيل الحضور");
      await loadSectionDetails(selectedSectionId);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  async function handleScanQr() {
    const values = attendanceForm.getValues();
    if (!values.sessionId) {
      toast.error("اختر جلسة أولًا");
      return;
    }

    if (!qrPayload) {
      toast.error("أنشئ QR أو الصق بياناته أولًا");
      return;
    }

    setQrLoading(true);
    try {
      await api.post(`/qr/scan/${values.sessionId}`, { qrData: qrPayload });
      toast.success("تم تسجيل الحضور من QR");
      await loadSectionDetails(selectedSectionId);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setQrLoading(false);
    }
  }

  async function generateQr(studentId: string) {
    if (!studentId) return;
    setQrLoading(true);
    try {
      const { data } = await api.get<QrResponse>(`/qr/student/${studentId}`);
      setQrImage(data.qrCode);
      setQrPayload(
        JSON.stringify({
          studentId: data.studentId,
          fullName: data.fullName,
          timestamp: new Date().toISOString(),
        }),
      );
      toast.success(`تم توليد QR لـ ${data.fullName}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setQrLoading(false);
    }
  }

  async function toggleSession(session: SessionItem, mode: "start" | "end") {
    try {
      await api.post(`/sessions/${session.id}/${mode}`);
      toast.success(mode === "start" ? "بدأت الجلسة" : "انتهت الجلسة");
      await loadSectionDetails(selectedSectionId);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="page-shell">
      <div className="page-wrap space-y-6">
        <header className="glass-card rounded-[2rem] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Badge>TEACHER Dashboard</Badge>
              <h1 className="mt-3 text-3xl font-bold text-slate-900">
                إدارة الحضور اليومي
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                الشعب، الجلسات، توليد QR، المسح، والحضور اليدوي من مكان واحد.
              </p>
            </div>
            <div className="flex flex-wrap items-start gap-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <Card className="rounded-2xl">
                  <CardContent className="p-4">
                    <p className="text-xs text-slate-500">Sections</p>
                    <p className="mt-1 text-2xl font-bold">{sections.length}</p>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl">
                  <CardContent className="p-4">
                    <p className="text-xs text-slate-500">Active</p>
                    <p className="mt-1 text-2xl font-bold">
                      {sessions.filter((session) => session.isActive).length}
                    </p>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl">
                  <CardContent className="p-4">
                    <p className="text-xs text-slate-500">Today</p>
                    <p className="mt-1 text-2xl font-bold">
                      {attendanceToday.length}
                    </p>
                  </CardContent>
                </Card>
              </div>
              <LogoutButton />
            </div>
          </div>
        </header>

        {sectionsLoading ? (
          <Card className="rounded-[2rem]">
            <CardContent className="p-6 text-sm text-slate-500">
              Loading sections...
            </CardContent>
          </Card>
        ) : sectionsError ? (
          <Card className="rounded-[2rem] border-red-200 bg-red-50">
            <CardContent className="p-6 text-sm text-red-700">
              {sectionsError}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>My Sections</CardTitle>
              <CardDescription>
                القائمة القادمة من `GET /sections/my-sections`.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {sections.map((section) => {
                  const course = section.courseSections?.[0]?.course;
                  const isActive = section.id === selectedSectionId;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setSelectedSectionId(section.id)}
                      className={`rounded-2xl border p-4 text-right transition ${isActive ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-900">
                            {section.name}
                          </div>
                          <div className="mt-1 text-sm text-slate-500">
                            {course?.name ?? "Course"}
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {section._count?.enrollments ??
                            section.enrollments?.length ??
                            0}{" "}
                          students
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>New Session</CardTitle>
              <CardDescription>أنشئ جلسة جديدة للشعبة المحددة.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="space-y-4" onSubmit={createSession}>
                <div className="space-y-2">
                  <Label>Session Title</Label>
                  <Input
                    placeholder="Lecture 1"
                    {...sessionForm.register("title")}
                  />
                  {sessionForm.formState.errors.title ? (
                    <p className="text-sm text-red-600">
                      {sessionForm.formState.errors.title.message}
                    </p>
                  ) : null}
                </div>
                <Button
                  className="w-full"
                  type="submit"
                  disabled={sessionForm.formState.isSubmitting}
                >
                  {sessionForm.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PlusCircle className="h-4 w-4" />
                  )}
                  Create Session
                </Button>
              </form>
              <Separator />
              <div className="space-y-3">
                {sessionsLoading ? (
                  <p className="text-sm text-slate-500">Loading sessions...</p>
                ) : sessions.length === 0 ? (
                  <p className="text-sm text-slate-500">لا توجد جلسات بعد.</p>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium">{session.title}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {session.startTime ?? "No start time"}
                          </div>
                        </div>
                        <Badge
                          variant={session.isActive ? "success" : "secondary"}
                        >
                          {session.isActive ? "ACTIVE" : "ENDED"}
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleSession(session, "start")}
                        >
                          <SendHorizontal className="h-4 w-4" /> Start
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => toggleSession(session, "end")}
                        >
                          End
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>QR Generation</CardTitle>
              <CardDescription>توليد QR لكل طالب داخل الشعبة.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Student</Label>
                <select
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                  defaultValue=""
                  onChange={(event) => generateQr(event.target.value)}
                >
                  <option value="" disabled>
                    اختر طالبًا
                  </option>
                  {sectionStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.fullName} - {student.studentId}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-5">
                {qrLoading ? (
                  <p className="text-sm text-slate-500">Generating QR...</p>
                ) : qrImage ? (
                  <img
                    alt="QR code"
                    src={qrImage}
                    className="mx-auto max-h-64 rounded-2xl bg-white p-2 shadow-sm"
                  />
                ) : (
                  <div className="grid place-items-center gap-2 py-10 text-center text-sm text-slate-500">
                    <QrCode className="h-8 w-8" />
                    اختر طالبًا لعرض الـ QR
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>Attendance</CardTitle>
              <CardDescription>
                تسجيل يدوي أو عبر QR على الجلسة النشطة.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form className="space-y-4" onSubmit={handleManualAttendance}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Session</Label>
                    <select
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                      {...attendanceForm.register("sessionId")}
                    >
                      <option value="">اختر جلسة</option>
                      {sessions.map((session) => (
                        <option key={session.id} value={session.id}>
                          {session.title} {session.isActive ? "(active)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Student ID</Label>
                    <Input
                      placeholder="ST1001"
                      {...attendanceForm.register("studentId")}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Arrival Time</Label>
                    <Input
                      type="datetime-local"
                      {...attendanceForm.register("arrivalTime")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input
                      placeholder="Optional notes"
                      {...attendanceForm.register("notes")}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>QR Data</Label>
                  <Textarea
                    value={qrPayload}
                    onChange={(event) => setQrPayload(event.target.value)}
                    placeholder="Paste QR JSON payload here"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="submit"
                    disabled={attendanceForm.formState.isSubmitting}
                  >
                    {attendanceForm.formState.isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Mark Manual
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleScanQr}
                    disabled={qrLoading}
                  >
                    {qrLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ScanLine className="h-4 w-4" />
                    )}
                    Scan QR
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle>Today's Attendance</CardTitle>
            <CardDescription>
              البيانات القادمة من `GET /attendance/:sectionId/today`.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceLoading ? (
              <p className="text-sm text-slate-500">Loading attendance...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceToday.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-8 text-center text-slate-500"
                      >
                        لا توجد سجلات اليوم.
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendanceToday.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.student?.fullName ?? "-"}</TableCell>
                        <TableCell>{row.student?.studentId ?? "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              row.status === "PRESENT"
                                ? "success"
                                : row.status === "LATE"
                                  ? "secondary"
                                  : "danger"
                            }
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {row.arrivalTime
                            ? new Date(row.arrivalTime).toLocaleTimeString(
                                "en-US",
                                { hour: "2-digit", minute: "2-digit" },
                              )
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
