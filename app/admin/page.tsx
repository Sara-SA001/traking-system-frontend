"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Loader2,
  PlusCircle,
  School,
  Trash2,
  UserCog,
  Users,
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

type CourseItem = {
  id: string;
  code: string;
  name: string;
  credits?: number;
  description?: string;
  isActive?: boolean;
};
type SectionItem = {
  id: string;
  name: string;
  semester: string;
  academicYear: string;
  room: string;
  schedule?: string;
  courseSections?: Array<{
    course?: { id: string; code?: string; name?: string };
  }>;
  sectionTeachers?: Array<{
    teacher?: {
      id: string;
      employeeId?: string;
      department?: string;
      user?: { id: string; fullName?: string; email?: string };
    };
  }>;
  enrollments?: Array<{
    student?: { id: string; studentId?: string; fullName?: string };
  }>;
};
type StudentItem = {
  id: string;
  studentId: string;
  fullName: string;
  email?: string;
  phone?: string;
  major?: string;
  semester?: number;
  nationalId?: string;
};
type UserItem = {
  id: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  teacher?: { id: string; employeeId?: string; department?: string };
  student?: {
    id: string;
    studentId?: string;
    major?: string;
    semester?: number;
  };
};
type SectionReport = {
  total: number;
  present: number;
  late: number;
  absent: number;
  attendances?: Array<{ id: string }>;
};
type StudentReport = {
  studentId: string;
  totalSessions: number;
  present: number;
  late: number;
  absent: number;
  records?: Array<{ id: string }>;
};

const courseSchema = z.object({
  code: z.string().min(2, "الكود مطلوب"),
  name: z.string().min(3, "اسم المقرر مطلوب"),
  credits: z.number().min(1, "الساعات مطلوبة"),
  description: z.string().optional(),
});

const sectionSchema = z.object({
  name: z.string().min(2, "اسم الشعبة مطلوب"),
  semester: z.string().min(1, "الفصل مطلوب"),
  academicYear: z.string().min(1, "العام الدراسي مطلوب"),
  room: z.string().min(1, "القاعة مطلوبة"),
  schedule: z.string().optional(),
});

const studentSchema = z.object({
  studentId: z.string().min(2, "رقم الطالب مطلوب"),
  fullName: z.string().min(3, "اسم الطالب مطلوب"),
  nationalId: z.string().optional(),
  email: z.string().email("بريد غير صحيح").optional().or(z.literal("")),
  phone: z.string().optional(),
  major: z.string().optional(),
  semester: z.number().optional(),
});

const teacherSchema = z.object({
  fullName: z.string().min(3, "اسم المدرس مطلوب"),
  email: z.string().email("بريد غير صحيح"),
  password: z.string().optional(),
  department: z.string().min(2, "القسم مطلوب"),
  employeeId: z.string().optional(),
});

const teacherAssignSchema = z.object({
  teacherId: z.string().min(1, "اختر مدرس"),
  sectionId: z.string().min(1, "اختر شعبة"),
});

const enrollmentSchema = z.object({
  studentId: z.string().min(1, "اختر طالب"),
  sectionId: z.string().min(1, "اختر شعبة"),
});

export default function AdminPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [sectionReport, setSectionReport] = useState<SectionReport | null>(
    null,
  );
  const [studentReport, setStudentReport] = useState<StudentReport | null>(
    null,
  );

  const [editingCourseId, setEditingCourseId] = useState("");
  const [editingSectionId, setEditingSectionId] = useState("");
  const [editingStudentId, setEditingStudentId] = useState("");
  const [editingTeacherId, setEditingTeacherId] = useState("");

  const courseForm = useForm<{
    code: string;
    name: string;
    credits: number;
    description?: string;
  }>({
    resolver: zodResolver(courseSchema),
    defaultValues: { code: "", name: "", credits: 3, description: "" },
  });

  const sectionForm = useForm<{
    name: string;
    semester: string;
    academicYear: string;
    room: string;
    schedule?: string;
  }>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      name: "",
      semester: "",
      academicYear: "",
      room: "",
      schedule: "",
    },
  });

  const studentForm = useForm<{
    studentId: string;
    fullName: string;
    nationalId?: string;
    email?: string;
    phone?: string;
    major?: string;
    semester?: number;
  }>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      studentId: "",
      fullName: "",
      nationalId: "",
      email: "",
      phone: "",
      major: "",
      semester: undefined,
    },
  });

  const teacherForm = useForm<z.infer<typeof teacherSchema>>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      department: "",
      employeeId: "",
    },
  });

  const assignForm = useForm<{ teacherId: string; sectionId: string }>({
    resolver: zodResolver(teacherAssignSchema),
    defaultValues: { teacherId: "", sectionId: "" },
  });

  const enrollmentForm = useForm<{ studentId: string; sectionId: string }>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: { studentId: "", sectionId: "" },
  });

  const reportsSectionId = selectedSectionId || sections[0]?.id || "";
  const reportsStudentId = selectedStudentId || students[0]?.id || "";

  const teachers = useMemo(
    () => users.filter((user) => user.role === "TEACHER"),
    [users],
  );

  async function loadAll() {
    setLoading(true);
    try {
      const [
        coursesResponse,
        sectionsResponse,
        studentsResponse,
        usersResponse,
      ] = await Promise.all([
        api.get<CourseItem[]>("/courses"),
        api.get<SectionItem[]>("/sections"),
        api.get<StudentItem[]>("/students"),
        api.get<UserItem[]>("/users"),
      ]);
      setCourses(coursesResponse.data);
      setSections(sectionsResponse.data);
      setStudents(studentsResponse.data);
      setUsers(usersResponse.data);
      setSelectedSectionId(sectionsResponse.data[0]?.id ?? "");
      setSelectedStudentId(studentsResponse.data[0]?.id ?? "");
      assignForm.setValue("sectionId", sectionsResponse.data[0]?.id ?? "");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    assignForm.setValue("sectionId", selectedSectionId);
  }, [selectedSectionId]);

  async function refreshReports() {
    if (reportsSectionId) {
      try {
        const { data } = await api.get<SectionReport>(
          `/reports/section/${reportsSectionId}`,
        );
        setSectionReport(data);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      }
    }

    if (reportsStudentId) {
      try {
        const { data } = await api.get<StudentReport>(
          `/reports/student/${reportsStudentId}`,
        );
        setStudentReport(data);
      } catch (error) {
        setStudentReport(null);
      }
    }
  }

  async function submitCourse(values: {
    code: string;
    name: string;
    credits: number;
    description?: string;
  }) {
    try {
      if (editingCourseId) {
        await api.patch(`/courses/${editingCourseId}`, values);
        toast.success("تم تحديث المقرر");
      } else {
        await api.post("/courses", values);
        toast.success("تم إنشاء المقرر");
      }
      setEditingCourseId("");
      courseForm.reset({ code: "", name: "", credits: 3, description: "" });
      await loadAll();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function submitSection(values: {
    name: string;
    semester: string;
    academicYear: string;
    room: string;
    schedule?: string;
  }) {
    const payload = {
      name: values.name,
      semester: values.semester,
      academicYear: values.academicYear,
      room: values.room,
      schedule: values.schedule ? safeJson(values.schedule) : undefined,
    };
    if (values.schedule && !payload.schedule) {
      toast.error("schedule يجب أن يكون JSON صالحًا");
      return;
    }

    try {
      if (editingSectionId) {
        await api.patch(`/sections/${editingSectionId}`, values);
        toast.success("تم تحديث الشعبة");
      } else {
        await api.post("/sections", payload);
        toast.success("تم إنشاء الشعبة");
      }
      setEditingSectionId("");
      sectionForm.reset({
        name: "",
        semester: "",
        academicYear: "",
        room: "",
        schedule: "",
      });
      await loadAll();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function submitStudent(values: {
    studentId: string;
    fullName: string;
    nationalId?: string;
    email?: string;
    phone?: string;
    major?: string;
    semester?: number;
  }) {
    try {
      if (editingStudentId) {
        await api.patch(`/students/${editingStudentId}`, values);
        toast.success("تم تحديث الطالب");
      } else {
        await api.post("/students", values);
        toast.success("تم إنشاء الطالب");
      }
      setEditingStudentId("");
      studentForm.reset({
        studentId: "",
        fullName: "",
        nationalId: "",
        email: "",
        phone: "",
        major: "",
        semester: undefined,
      });
      await loadAll();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function submitTeacher(values: z.infer<typeof teacherSchema>) {
    if (!values.password || values.password.length < 6) {
      toast.error("كلمة المرور مطلوبة عند إنشاء المدرس");
      return;
    }
    try {
      await api.post("/auth/register", {
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        role: "TEACHER",
        department: values.department,
        employeeId: values.employeeId,
      });
      toast.success("تم إنشاء المدرس");
      teacherForm.reset({
        fullName: "",
        email: "",
        password: "",
        department: "",
        employeeId: "",
      });
      await loadAll();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function submitAssign(values: {
    teacherId: string;
    sectionId: string;
  }) {
    try {
      await api.post("/teachers/assign", values);
      toast.success("تم ربط المدرس بالشعبة");
      await loadAll();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function submitEnrollment(values: {
    studentId: string;
    sectionId: string;
  }) {
    try {
      await api.post("/enrollments", values);
      toast.success("تم ربط الطالب بالشعبة");
      enrollmentForm.reset();
      await loadAll();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function deleteCourse(id: string) {
    try {
      await api.delete(`/courses/${id}`);
      toast.success("تم حذف المقرر");
      await loadAll();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function deleteSection(id: string) {
    try {
      await api.delete(`/sections/${id}`);
      toast.success("تم حذف الشعبة");
      await loadAll();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function deleteStudent(id: string) {
    try {
      await api.delete(`/students/${id}`);
      toast.success("تم حذف الطالب");
      await loadAll();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function deleteTeacher(id: string) {
    try {
      await api.delete(`/users/${id}`);
      toast.success("تم حذف المدرس");
      await loadAll();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function editTeacher(user: UserItem) {
    setEditingTeacherId(user.id);
    teacherForm.setValue("fullName", user.fullName);
    teacherForm.setValue("email", user.email);
    teacherForm.setValue("password", "");
    teacherForm.setValue("department", user.teacher?.department ?? "");
    teacherForm.setValue("employeeId", user.teacher?.employeeId ?? "");
  }

  async function updateTeacher(values: z.infer<typeof teacherSchema>) {
    try {
      await api.patch(`/users/${editingTeacherId}`, {
        fullName: values.fullName,
        email: values.email,
        department: values.department,
        employeeId: values.employeeId,
      });
      toast.success("تم تحديث المدرس");
      setEditingTeacherId("");
      teacherForm.reset({
        fullName: "",
        email: "",
        password: "",
        department: "",
        employeeId: "",
      });
      await loadAll();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  const submitTeacherForm = teacherForm.handleSubmit(async (values) => {
    if (editingTeacherId) {
      await updateTeacher(values);
      return;
    }
    await submitTeacher(values);
  });

  useEffect(() => {
    if (reportsSectionId || reportsStudentId) {
      refreshReports();
    }
  }, [reportsSectionId, reportsStudentId]);

  return (
    <div className="page-shell">
      <div className="page-wrap space-y-6">
        <header className="glass-card rounded-[2rem] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Badge>ADMIN Dashboard</Badge>
              <h1 className="mt-3 text-3xl font-bold text-slate-900">
                إدارة النظام والتقارير
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                CRUD للمقررات والشعب والطلاب والمدرسين مع تقارير مباشرة من الـ
                backend.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => loadAll()} variant="outline" type="button">
                <Loader2
                  className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"}
                />
                Refresh
              </Button>
              <LogoutButton />
            </div>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Courses" value={courses.length} icon={BookOpen} />
          <StatCard label="Sections" value={sections.length} icon={School} />
          <StatCard label="Students" value={students.length} icon={Users} />
          <StatCard label="Teachers" value={teachers.length} icon={UserCog} />
        </div>

        {loading ? (
          <Card className="rounded-[2rem]">
            <CardContent className="p-6 text-sm text-slate-500">
              Loading data...
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <ResourceCard
            title="Manage Courses"
            description="Create, edit, delete courses."
          >
            <form
              className="space-y-4"
              onSubmit={courseForm.handleSubmit(submitCourse)}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Code">
                  <Input {...courseForm.register("code")} />
                </Field>
                <Field label="Name">
                  <Input {...courseForm.register("name")} />
                </Field>
                <Field label="Credits">
                  <Input
                    type="number"
                    {...courseForm.register("credits", { valueAsNumber: true })}
                  />
                </Field>
                <Field label="Description">
                  <Input {...courseForm.register("description")} />
                </Field>
              </div>
              <Button
                type="submit"
                disabled={courseForm.formState.isSubmitting}
              >
                {courseForm.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="h-4 w-4" />
                )}
                {editingCourseId ? "Update Course" : "Create Course"}
              </Button>
            </form>
            <Separator className="my-4" />
            <DataTable
              headers={["Code", "Name", "Credits", "Actions"]}
              rows={courses.map((course) => [
                course.code,
                course.name,
                String(course.credits ?? "-"),
                <RowActions
                  key={course.id}
                  onEdit={() => {
                    setEditingCourseId(course.id);
                    courseForm.reset({
                      code: course.code,
                      name: course.name,
                      credits: course.credits ?? 0,
                      description: course.description ?? "",
                    });
                  }}
                  onDelete={() => deleteCourse(course.id)}
                />,
              ])}
            />
          </ResourceCard>

          <ResourceCard
            title="Manage Sections"
            description="Create, edit, delete sections."
          >
            <form
              className="space-y-4"
              onSubmit={sectionForm.handleSubmit(submitSection)}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Name">
                  <Input {...sectionForm.register("name")} />
                </Field>
                <Field label="Semester">
                  <Input {...sectionForm.register("semester")} />
                </Field>
                <Field label="Academic Year">
                  <Input {...sectionForm.register("academicYear")} />
                </Field>
                <Field label="Room">
                  <Input {...sectionForm.register("room")} />
                </Field>
                <Field label="Schedule JSON" className="md:col-span-2">
                  <Textarea rows={3} {...sectionForm.register("schedule")} />
                </Field>
              </div>
              <Button
                type="submit"
                disabled={sectionForm.formState.isSubmitting}
              >
                {sectionForm.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="h-4 w-4" />
                )}
                {editingSectionId ? "Update Section" : "Create Section"}
              </Button>
            </form>
            <Separator className="my-4" />
            <DataTable
              headers={["Name", "Semester", "Room", "Actions"]}
              rows={sections.map((section) => [
                section.name,
                section.semester,
                section.room,
                <RowActions
                  key={section.id}
                  onEdit={() => {
                    setEditingSectionId(section.id);
                    sectionForm.reset({
                      name: section.name,
                      semester: section.semester,
                      academicYear: section.academicYear,
                      room: section.room,
                      schedule: section.schedule ?? "",
                    });
                  }}
                  onDelete={() => deleteSection(section.id)}
                />,
              ])}
            />
          </ResourceCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <ResourceCard
            title="Manage Students"
            description="Create, edit, delete students and enroll them in sections."
          >
            <form
              className="space-y-4"
              onSubmit={studentForm.handleSubmit(submitStudent)}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Student ID">
                  <Input {...studentForm.register("studentId")} />
                </Field>
                <Field label="Full Name">
                  <Input {...studentForm.register("fullName")} />
                </Field>
                <Field label="Email">
                  <Input {...studentForm.register("email")} />
                </Field>
                <Field label="Phone">
                  <Input {...studentForm.register("phone")} />
                </Field>
                <Field label="Major">
                  <Input {...studentForm.register("major")} />
                </Field>
                <Field label="Semester">
                  <Input
                    type="number"
                    {...studentForm.register("semester", {
                      valueAsNumber: true,
                    })}
                  />
                </Field>
                <Field label="National ID" className="md:col-span-2">
                  <Input {...studentForm.register("nationalId")} />
                </Field>
              </div>
              <Button
                type="submit"
                disabled={studentForm.formState.isSubmitting}
              >
                {studentForm.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="h-4 w-4" />
                )}
                {editingStudentId ? "Update Student" : "Create Student"}
              </Button>
            </form>
            <Separator className="my-4" />
            <form
              className="space-y-4"
              onSubmit={enrollmentForm.handleSubmit(submitEnrollment)}
            >
              <h4 className="text-sm font-semibold text-slate-700">
                Enroll Student in Section
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Student">
                  <select
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                    {...enrollmentForm.register("studentId")}
                  >
                    <option value="">Select student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.fullName} ({student.studentId})
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Section">
                  <select
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                    {...enrollmentForm.register("sectionId")}
                  >
                    <option value="">Select section</option>
                    {sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Button type="submit" variant="outline">
                <CheckCircle2 className="h-4 w-4" />
                Enroll Student
              </Button>
            </form>
            <Separator className="my-4" />
            <DataTable
              headers={["Name", "ID", "Major", "Actions"]}
              rows={students.map((student) => [
                student.fullName,
                student.studentId,
                student.major ?? "-",
                <RowActions
                  key={student.id}
                  onEdit={() => {
                    setEditingStudentId(student.id);
                    studentForm.reset({
                      studentId: student.studentId,
                      fullName: student.fullName,
                      nationalId: student.nationalId ?? "",
                      email: student.email ?? "",
                      phone: student.phone ?? "",
                      major: student.major ?? "",
                      semester: student.semester,
                    });
                  }}
                  onDelete={() => deleteStudent(student.id)}
                />,
              ])}
            />
          </ResourceCard>

          <ResourceCard
            title="Manage Teachers"
            description="Create, edit, delete teachers and assign sections."
          >
            <form className="space-y-4" onSubmit={submitTeacherForm}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Full Name">
                  <Input {...teacherForm.register("fullName")} />
                </Field>
                <Field label="Email">
                  <Input {...teacherForm.register("email")} />
                </Field>
                <Field label="Password">
                  <Input
                    type="password"
                    {...teacherForm.register("password")}
                  />
                </Field>
                <Field label="Department">
                  <Input {...teacherForm.register("department")} />
                </Field>
                <Field label="Employee ID">
                  <Input {...teacherForm.register("employeeId")} />
                </Field>
              </div>
              <Button
                type="submit"
                disabled={teacherForm.formState.isSubmitting}
              >
                {teacherForm.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="h-4 w-4" />
                )}
                {editingTeacherId ? "Update Teacher" : "Create Teacher"}
              </Button>
            </form>
            <Separator className="my-4" />
            <form
              className="space-y-4"
              onSubmit={assignForm.handleSubmit(submitAssign)}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Teacher">
                  <select
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                    {...assignForm.register("teacherId")}
                  >
                    <option value="">Select teacher</option>
                    {teachers.map((teacher) => (
                      <option
                        key={teacher.id}
                        value={teacher.teacher?.id ?? teacher.id}
                      >
                        {teacher.fullName}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Section">
                  <select
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                    {...assignForm.register("sectionId")}
                  >
                    <option value="">Select section</option>
                    {sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Button type="submit" variant="outline">
                <CheckCircle2 className="h-4 w-4" />
                Assign Teacher
              </Button>
            </form>
            <Separator className="my-4" />
            <DataTable
              headers={["Name", "Email", "Department", "Actions"]}
              rows={teachers.map((teacher) => [
                teacher.fullName,
                teacher.email,
                teacher.teacher?.department ?? "-",
                <RowActions
                  key={teacher.id}
                  onEdit={() => editTeacher(teacher)}
                  onDelete={() => deleteTeacher(teacher.id)}
                />,
              ])}
            />
          </ResourceCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>Section Report</CardTitle>
              <CardDescription>GET /reports/section/:sectionId</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Section">
                <select
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  value={reportsSectionId}
                  onChange={(event) => setSelectedSectionId(event.target.value)}
                >
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <div>Total: {sectionReport?.total ?? "-"}</div>
                <div className="mt-1">
                  Present: {sectionReport?.present ?? "-"}
                </div>
                <div className="mt-1">Late: {sectionReport?.late ?? "-"}</div>
                <div className="mt-1">
                  Absent: {sectionReport?.absent ?? "-"}
                </div>
              </div>
              <Button onClick={refreshReports} type="button">
                <BarChart3 className="h-4 w-4" /> Load Report
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>Student Report</CardTitle>
              <CardDescription>GET /reports/student/:studentId</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Student">
                <select
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  value={reportsStudentId}
                  onChange={(event) => setSelectedStudentId(event.target.value)}
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.fullName}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <div>Total Sessions: {studentReport?.totalSessions ?? "-"}</div>
                <div className="mt-1">
                  Present: {studentReport?.present ?? "-"}
                </div>
                <div className="mt-1">Late: {studentReport?.late ?? "-"}</div>
                <div className="mt-1">
                  Absent: {studentReport?.absent ?? "-"}
                </div>
              </div>
              <Button onClick={refreshReports} type="button">
                <BarChart3 className="h-4 w-4" /> Load Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function safeJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="rounded-3xl">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function ResourceCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="rounded-[2rem]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`.trim()}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {headers.map((header) => (
            <TableHead key={header}>{header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={headers.length}
              className="py-8 text-center text-slate-500"
            >
              No records
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, index) => (
            <TableRow key={index}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex}>{cell}</TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="outline" onClick={onEdit}>
        Edit
      </Button>
      <Button type="button" size="sm" variant="destructive" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
