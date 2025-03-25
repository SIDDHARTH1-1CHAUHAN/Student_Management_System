"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import {
  announcementSchema,
  AnnouncementSchema,
} from "@/lib/formValidationSchemas";
import { createAnnouncement, updateAnnouncement } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const AnnouncementForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AnnouncementSchema>({
    resolver: zodResolver(announcementSchema),
  });

  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [state, formAction] = useFormState(
    type === "create" ? createAnnouncement : updateAnnouncement,
    {
      success: false,
      error: false,
    }
  );

  // Watch the "type" field to determine if teacher selection should be shown
  const announcementType = watch("type", data?.type || "GENERAL");

  const onSubmit = handleSubmit((data) => {
    const reader = new FileReader();
    if (file) {
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64File = reader.result?.toString().split(",")[1];
        const formData = {
          ...data,
          teacherIds: selectedTeachers,
          file: file ? { name: file.name, data: base64File } : null,
        };
        formAction(formData);
      };
    } else {
      const formData = {
        ...data,
        teacherIds: selectedTeachers,
        file: null,
      };
      formAction(formData);
    }
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(
        `Announcement has been ${type === "create" ? "created" : "updated"}!`
      );
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const teachers = relatedData?.teachers || [];

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create"
          ? "Create a new announcement"
          : "Update the announcement"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Announcement title"
          name="title"
          defaultValue={data?.title}
          register={register}
          error={errors?.title}
        />
        <InputField
          label="Content"
          name="content"
          defaultValue={data?.content}
          register={register}
          error={errors?.content}
          type="textarea"
        />

        {data && (
          <InputField
            label="Id"
            name="id"
            defaultValue={data?.id}
            register={register}
            error={errors?.id}
            hidden
          />
        )}

        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Type</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("type")}
            defaultValue={data?.type || "GENERAL"}
          >
            <option value="GENERAL">General Announcement</option>
            <option value="TEACHER_SPECIFIC">
              Teacher-Specific Announcement
            </option>
          </select>
          {errors.type?.message && (
            <p className="text-xs text-red-400">
              {errors.type.message.toString()}
            </p>
          )}
        </div>

        {announcementType === "TEACHER_SPECIFIC" && (
          <div className="flex flex-col gap-2 w-full">
            <label className="text-xs text-gray-500">
              Teachers (for teacher-specific announcements)
            </label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              multiple
              onChange={(e) => {
                const selectedOptions = Array.from(
                  e.target.selectedOptions
                ).map((option) => option.value);
                setSelectedTeachers(selectedOptions);
              }}
            >
              {teachers.map((teacher: { id: string; name: string }) => (
                <option value={teacher.id} key={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
            {errors.teacherIds?.message && (
              <p className="text-xs text-red-400">
                {errors.teacherIds.message.toString()}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">
            Upload File (PDF, Image, Excel, max 10MB)
          </label>
          <input
            type="file"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0];
              if (selectedFile) {
                if (selectedFile.size > 10 * 1024 * 1024) {
                  toast.error("File size must be less than 10MB");
                  e.target.value = ""; 
                } else {
                  setFile(selectedFile);
                }
              }
            }}
          />
        </div>
      </div>

      {state.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}

      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default AnnouncementForm;
