"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { subjectSchema, SubjectSchema } from "@/lib/formValidationSchemas";
import { createSubject, updateSubject } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Select from "react-select";

const SubjectForm = ({
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
    setValue,
    formState: { errors },
  } = useForm<SubjectSchema>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      teachers: data?.teachers || [],
    },
  });

  const [file, setFile] = useState<File | null>(null);

  const [selectedTeachers, setSelectedTeachers] = useState(
    data?.teachers?.map((teacher: any) => ({
      value: teacher.id,
      label: `${teacher.name}`,
    })) || []
  );

  const [state, formAction] = useFormState(
    type === "create" ? createSubject : updateSubject,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((data) => {
    const reader = new FileReader();
    if (file) {
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64File = reader.result?.toString().split(",")[1];
        const formData = {
          ...data,
          file: file ? { name: file.name, data: base64File } : null,
        };
        formAction(formData);
      };
    } else {
      const formData = {
        ...data,
        file: null,
      };
      formAction(formData);
    }
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Subject has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { teachers } = relatedData;
  const { semesters, branches } = relatedData;

  const teacherOptions = teachers.map((teacher: any) => ({
    value: teacher.id,
    label: `${teacher.name}`,
  }));

  return (
    <form className="flex flex-col gap-10" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new subject" : "Update the subject"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Subject name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
        />
        <InputField
          label="Maximum Marks"
          name="maxMarks"
          defaultValue={data?.maxMarks}
          register={register}
          error={errors?.maxMarks}
        />
        <InputField
          label="Subject Code"
          name="subjectCode"
          defaultValue={data?.subjectCode}
          register={register}
          error={errors?.subjectCode}
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
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Type</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("type")}
            defaultValue={data?.type}
          >
            <option value="THEORY">THEORY</option>
            <option value="PRACTICAL">PRACTICAL</option>
          </select>
          {errors.type?.message && (
            <p className="text-xs text-red-400">
              {errors.type.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Branch</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("branchId")}
            defaultValue={data?.branchId}
          >
            {branches.map(
              (branchItem: {
                id: number;
                name: string;
                capacity: number;
                _count: { students: number };
              }) => (
                <option value={branchItem.id} key={branchItem.id}>
                  ({branchItem.name} -{" "}
                  {branchItem._count.students + "/" + branchItem.capacity}{" "}
                  Capacity)
                </option>
              )
            )}
          </select>
          {errors.branchId?.message && (
            <p className="text-xs text-red-400">
              {errors.branchId.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Semester</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("semesterId")}
            defaultValue={data?.semesterId}
          >
            {semesters.map((semester: { id: number; level: number }) => (
              <option value={semester.id} key={semester.id}>
                {semester.level}
              </option>
            ))}
          </select>
          {errors.semesterId?.message && (
            <p className="text-xs text-red-400">
              {errors.semesterId.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full ">
          <label className="text-xs text-gray-500">Teachers</label>
          <Select
            isMulti
            options={teacherOptions}
            value={selectedTeachers}
            onChange={(selectedOptions) => {
              setSelectedTeachers(selectedOptions as any);
              setValue(
                "teachers",
                (selectedOptions as any).map((option: any) => option.value)
              );
            }}
            className="basic-multi-select"
            classNamePrefix="select"
          />
          {errors.teachers?.message && (
            <p className="text-xs text-red-400">
              {errors.teachers.message.toString()}
            </p>
          )}
        </div>
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

export default SubjectForm;