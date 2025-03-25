"use server";

import { revalidatePath } from "next/cache";
import {
  BranchSchema,
  ExamSchema,
  RegistrarSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
  AnnouncementSchema,
  ResultSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import { clerkClient } from "@clerk/nextjs/server";

import { writeFile, mkdir, unlink } from "fs/promises";
import { join, resolve } from "path";
import { existsSync } from "fs";

const STORAGE_PATH = process.env.STORAGE_PATH || "./public/uploads";
const PUBLIC_URL_PATH = `${process.env.STORAGE_PATH}`;

type CurrentState = { success: boolean; error: boolean };

export const createSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    const { name, subjectCode, type, maxMarks, branchId, semesterId, file } =
      data;
    let fileUrl = null;

    // Handle file upload if a file is provided
    if (file) {
      if (file.data.length > 10 * 1024 * 1024) {
        throw new Error("File size must be less than 10MB");
      }
      const fileData = Buffer.from(file.data, "base64"); // Decode base64 file data
      const safeFileName = `${Date.now()}_${file.name}`; // Create a unique file name
      const filePath = join(STORAGE_PATH, safeFileName); // Define the file path

      if (!existsSync(STORAGE_PATH)) {
        await mkdir(STORAGE_PATH, { recursive: true });
      }

      await writeFile(filePath, fileData);

      fileUrl = safeFileName;
    }
    await prisma.subject.create({
      data: {
        name,
        type,
        subjectCode,
        maxMarks,
        fileUrl,
        branchId,
        semesterId,
        teachers: {
          connect: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    const {
      id,
      name,
      subjectCode,
      type,
      maxMarks,
      branchId,
      semesterId,
      file,
    } = data;
    if (!id) {
      throw new Error("Subject ID is required");
    }
    let fileUrl = null;

    if (file) {
      if (file.data.length > 10 * 1024 * 1024) {
        throw new Error("File size must be less than 10MB");
      }
      const fileData = Buffer.from(file.data, "base64"); // Decode base64 file data
      const safeFileName = `${Date.now()}_${file.name}`; // Create a unique file name
      const filePath = join(STORAGE_PATH, safeFileName); // Define the file path

      // Create the uploads directory if it doesn't exist
      if (!existsSync(STORAGE_PATH)) {
        await mkdir(STORAGE_PATH, { recursive: true });
      }

      // Save the file to the server
      await writeFile(filePath, fileData);

      // Store only the filename in the database
      fileUrl = safeFileName;

      // Delete the old file if it exists
      const existingSubject = await prisma.subject.findUnique({
        where: { id },
      });
      if (existingSubject?.fileUrl) {
        const oldFilePath = join(STORAGE_PATH, existingSubject.fileUrl);
        if (existsSync(oldFilePath)) {
          console.log("Deleting old file:", oldFilePath); // Debugging
          await unlink(oldFilePath); // Delete the old file
        }
      }
    }
    await prisma.subject.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        type: data.type,
        subjectCode: data.subjectCode,
        maxMarks: data.maxMarks,
        branchId: data.branchId,
        fileUrl: fileUrl || undefined,
        semesterId: data.semesterId,
        teachers: {
          set: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteSubject = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(id) },
    });

    if (!subject) {
      throw new Error("Subject not found");
    }
    if (subject.fileUrl) {
      const filePath = join(STORAGE_PATH, subject.fileUrl);
      if (existsSync(filePath)) {
        console.log("Deleting file:", filePath); // Debugging
        await unlink(filePath); // Delete the file
      }
    }
    await prisma.subject.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createBranch = async (
  currentState: CurrentState,
  data: BranchSchema
) => {
  try {
    await prisma.branch.create({
      data: {
        name: data.name,
        capacity: data.capacity,
        teachers: {
          connect: data.teachers.map((teacherId: string) => ({
            id: teacherId,
          })),
        },
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateBranch = async (
  currentState: CurrentState,
  data: BranchSchema
) => {
  try {
    await prisma.branch.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        capacity: data.capacity,
        teachers: {
          set: data.teachers.map((teacherId: string) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteBranch = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.branch.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    const user = await clerkClient.users.createUser({
      username: data.username,
      password: data.password,
      // name: data.name,
      publicMetadata: { role: "teacher" },
    });

    await prisma.teacher.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        password: data.password,
        email: data.email || null,
        phone: data.phone || null,
        division: data.division,
        subjects: {
          connect: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
        branches: {
          connect: data.branches?.map((branchId: string) => ({
            id: parseInt(branchId),
          })),
        },
      },
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    // const user = await clerkClient.users.updateUser(data.id, {
    //   username: data.username,
    //   ...(data.password !== "" && { password: data.password }),
    //   name: data.name,

    // });

    await prisma.teacher.update({
      where: {
        id: data.id,
      },
      data: {
        ...(data.password !== "" && { password: data.password }),
        username: data.username,
        name: data.name,
        password: data.password,
        email: data.email || null,
        phone: data.phone || null,
        division: data.division,
        subjects: {
          connect: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
        branches: {
          connect: data.branches?.map((branchId: string) => ({
            id: parseInt(branchId),
          })),
        },
      },
    });
    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await clerkClient.users.deleteUser(id);

    await prisma.teacher.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createRegistrar = async (
  currentState: CurrentState,
  data: RegistrarSchema
) => {
  try {
    const user = await clerkClient.users.createUser({
      username: data.username,
      password: data.password || "",
      // name: data.name,
      publicMetadata: { role: "registrar" },
    });

    await prisma.registrar.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        email: data.email || null,
        phone: data.phone || "",
      },
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateRegistrar = async (
  currentState: CurrentState,
  data: RegistrarSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const user = await clerkClient.users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      name: data.name,
    });

    await prisma.registrar.update({
      where: {
        id: data.id,
      },
      data: {
        ...(data.password !== "" && { password: data.password }),
        username: data.username,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
      },
    });
    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteRegistrar = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await clerkClient.users.deleteUser(id);

    await prisma.registrar.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  console.log(data);
  try {
    const branchItem = await prisma.branch.findUnique({
      where: { id: data.branchId },
      include: { _count: { select: { students: true } } },
    });

    if (branchItem && branchItem.capacity === branchItem._count.students) {
      return { success: false, error: true };
    }

    // const user = await clerkClient.users.createUser({
    //   username: data.username,
    //   password: data.password,
    //   name: data.name,
    //   fatherName: data.fatherName,
    //   motherName: data.motherName,

    //   publicMetadata:{role:"student"}
    // });

    await prisma.student.create({
      data: {
        // id: user.id,
        username: data.username,
        password: data.password || "",
        name: data.name,
        fatherName: data.fatherName,
        motherName: data.motherName,
        address: data.address,
        birthday: new Date(data.birthday),
        phone: data.phone || "",
        email: data.email,
        sex: data.sex,
        bloodType: data.bloodType,
        semesterId: data.semesterId,
        branchId: data.branchId,
      },
    });

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    // const user = await clerkClient.users.updateUser(data.id, {
    //   username: data.username,
    //   ...(data.password !== "" && { password: data.password }),
    //   name: data.name,
    //   fatherName: data.fatherName,
    //   motherName: data.motherName,
    // });

    await prisma.student.update({
      where: {
        id: data.id,
      },
      data: {
        ...(data.password !== "" && { password: data.password }),
        username: data.username,
        password: data.password,
        name: data.name,
        fatherName: data.fatherName,
        motherName: data.motherName,
        address: data.address,
        birthday: data.birthday,
        phone: data.phone,
        email: data.email,
        sex: data.sex,
        bloodType: data.bloodType,
        semesterId: data.semesterId,
        branchId: data.branchId,
      },
    });
    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    // await clerkClient.users.deleteUser(id);

    await prisma.student.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const getAllExams = async () => {
  try {
    const exams = await prisma.exam.findMany();
    return { success: true, data: exams }; // ✅ Wrap the response
  } catch (err) {
    console.log(err);
    return { success: false, data: [] }; // ✅ Handle errors properly
  }
};

export const getAllSemesters = async () => {
  try {
    const semesters = await prisma.semester.findMany();
    return { success: true, data: semesters };
  } catch (err) {
    console.log(err);
    return { success: false, data: [] };
  }
};

export const getAllBranches = async () => {
  try {
    const branches = await prisma.branch.findMany();
    return { success: true, data: branches };
  } catch (err) {
    console.log(err);
    return { success: false, data: [] };
  }
};

export const getExams = async () => {
  try {
    const exams = await prisma.exam.findMany({
      include: {
        subject: true,
        semester: true,
        branch: true,
      },
    });
    return { success: true, data: exams };
  } catch (error) {
    return { success: false, error: "Failed to fetch exams" };
  }
};

export async function createExam(data: {
  subjectId: number;
  examDate: Date;
  startTime: Date;
  endTime: Date;
  semesterId: number;
  branchId: number;
}) {
  try {
    const exam = await prisma.exam.create({ data });
    return { success: true, data: exam };
  } catch (error) {
    console.error("Error creating exam:", error);
    return { success: false, error: "Failed to create exam" };
  }
}

export const updateExam = async (
  id: number,
  data: Partial<{
    subjectId: number;
    examDate: Date;
    startTime: Date;
    endTime: Date;
    semesterId: number;
    branchId: number;
  }>
) => {
  try {
    const updatedExam = await prisma.exam.update({
      where: { id },
      data,
    });
    return { success: true, data: updatedExam };
  } catch (error) {
    return { success: false, error: "Failed to update exam" };
  }
};

export const deleteExam = async (id: number) => {
  try {
    await prisma.exam.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete exam" };
  }
};
export const fetchSubjects = async (semesterId: number, branchId: number) => {
  try {
    const subjects = await prisma.subject.findMany({
      where: {
        semesterId: semesterId,
        branchId: branchId,
      },
      include: {
        teachers: true,
        branch: true,
        semester: true,
      },
    });

    return { success: true, data: subjects, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, data: [], error: true };
  }
};

export const createAnnouncement = async (
  currentState: any,
  data: AnnouncementSchema
) => {
  try {
    const { title, content, type, teacherIds, file } = data;

    let fileUrl = null;

    if (file) {
      if (file.data.length > 10 * 1024 * 1024) {
        throw new Error("File size must be less than 10MB");
      }

      const fileData = Buffer.from(file.data, "base64"); // Decode base64 file data
      const safeFileName = `${Date.now()}_${file.name}`; // Create a unique file name
      const filePath = join(STORAGE_PATH, safeFileName); // Define the file path

      // Create the uploads directory if it doesn't exist
      if (!existsSync(STORAGE_PATH)) {
        await mkdir(STORAGE_PATH, { recursive: true });
      }

      // Save the file to the server
      await writeFile(filePath, fileData);

      // Store only the filename in the database
      fileUrl = safeFileName;
    }

    // Save the announcement to the database
    await prisma.announcement.create({
      data: {
        title,
        content,
        type,
        fileUrl, // Save the filename in the database (or null if no file)
        teachers: {
          create:
            type === "TEACHER_SPECIFIC"
              ? teacherIds?.map((teacherId) => ({ teacherId }))
              : [],
        },
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.error("Error creating announcement:", err);
    return { success: false, error: true, message: err.message };
  }
};
export const updateAnnouncement = async (
  currentState: any,
  data: AnnouncementSchema
) => {
  try {
    const { id, title, content, type, teacherIds, file } = data;

    if (!id) {
      throw new Error("Announcement ID is required");
    }

    let fileUrl = null;

    if (file) {
      if (file.data.length > 10 * 1024 * 1024) {
        throw new Error("File size must be less than 10MB");
      }
      const fileData = Buffer.from(file.data, "base64");
      const safeFileName = `${Date.now()}_${file.name}`;
      const filePath = join(STORAGE_PATH, safeFileName);
      if (!existsSync(STORAGE_PATH)) {
        await mkdir(STORAGE_PATH, { recursive: true });
      }
      await writeFile(filePath, fileData);
      fileUrl = safeFileName;
      const existingAnnouncement = await prisma.announcement.findUnique({
        where: { id },
      });
      if (existingAnnouncement?.fileUrl) {
        const oldFilePath = join(STORAGE_PATH, existingAnnouncement.fileUrl);
        if (existsSync(oldFilePath)) {
          console.log("Deleting old file:", oldFilePath);
          await unlink(oldFilePath);
        }
      }
    }
    await prisma.announcementTeacher.deleteMany({
      where: {
        announcementId: id,
      },
    });
    await prisma.announcement.update({
      where: {
        id,
      },
      data: {
        title,
        content,
        type,
        fileUrl: fileUrl || undefined,
        teachers: {
          create:
            type === "TEACHER_SPECIFIC"
              ? teacherIds?.map((teacherId) => ({ teacherId }))
              : [],
        },
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.error("Error updating announcement:", err);
    return { success: false, error: true };
  }
};

export const deleteAnnouncement = async (currentState: any, data: FormData) => {
  const id = data.get("id") as string;

  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: parseInt(id) },
    });

    if (!announcement) {
      throw new Error("Announcement not found");
    }

    if (announcement.fileUrl) {
      const filePath = join(STORAGE_PATH, announcement.fileUrl);
      if (existsSync(filePath)) {
        console.log("Deleting file:", filePath);
        await unlink(filePath);
      }
    }
    await prisma.announcementTeacher.deleteMany({
      where: {
        announcementId: parseInt(id),
      },
    });
    await prisma.announcement.delete({
      where: {
        id: parseInt(id),
      },
    });
    return { success: true, error: false };
  } catch (err) {
    console.error("Error deleting announcement:", err);
    return { success: false, error: true };
  }
};
export const createResult = async (
  currentState: CurrentState,
  data: ResultSchema
) => {
  try {
    await prisma.result.create({
      data: {
        sessionalExam: data.sessionalExam,
        endTerm: data.endTerm,
        overallMark: data.overallMark ?? "",
        grade: data.grade ?? "",
        studentId: data.studentId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateResult = async (
  currentState: CurrentState,
  data: ResultSchema
) => {
  try {
    await prisma.result.update({
      where: {
        id: data.id,
      },
      data: {
        sessionalExam: data.sessionalExam,
        endTerm: data.endTerm,
        overallMark: data.overallMark ?? "",
        grade: data.grade ?? "",
        studentId: data.studentId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteResult = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    await prisma.result.delete({
      where: {
        id: parseInt(id),
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};
