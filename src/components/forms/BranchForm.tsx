"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { branchSchema, BranchSchema } from "@/lib/formValidationSchemas";
import { createBranch, updateBranch } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Select from "react-select";

const BranchForm = ({
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
  } = useForm<BranchSchema>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      teachers: data?.teachers || [],
      semesters: data?.semesters || [],
    },
  });

  const [selectedTeachers, setSelectedTeachers] = useState(
    data?.teachers?.map((teacherId: string) => {
      const teacher = relatedData.teachers.find((t: any) => t.id === teacherId);
      return {
        value: teacherId,
        label: `${teacher?.name || ""} ${teacher?.surname || ""}`.trim(),
      };
    }) || []
  );

  const [selectedSemesters, setSelectedSemesters] = useState(
    data?.semesters?.map((semesterId: number) => {
      const semester = relatedData.semesters.find((s: any) => s.id === semesterId);
      return {
        value: semesterId,
        label: semester?.level.toString() || "",
      };
    }) || []
  );

  const [state, formAction] = useFormState(
    type === "create" ? createBranch : updateBranch,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    formAction(data);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Branch has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { teachers, semesters } = relatedData;

  const teacherOptions = teachers.map((teacher: any) => ({
    value: teacher.id,
    label: `${teacher.name || ""} ${teacher.surname || ""}`.trim(),
  }));

  const semesterOptions = semesters.map((semester: any) => ({
    value: semester.id,
    label: semester.level.toString(),
  }));

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new branch" : "Update the branch"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Branch Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
        />
        <InputField
          label="Total Students"
          name="capacity"
          defaultValue={data?.capacity}
          register={register}
          error={errors?.capacity}
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
        <div className="gap-2 w-full md:w-1/4 hidden">
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
        <div className="gap-2 w-full md:w-1/4 hidden">
          <label className="text-xs text-gray-500">Semesters</label>
          <Select
            isMulti
            options={semesterOptions}
            value={selectedSemesters}
            onChange={(selectedOptions) => {
              setSelectedSemesters(selectedOptions as any);
              setValue(
                "semesters",
                (selectedOptions as any).map((option: any) => option.value)
              );
            }}
            className="basic-multi-select"
            classNamePrefix="select"
          />
          {errors.semesters?.message && (
            <p className="text-xs text-red-400">
              {errors.semesters.message.toString()}
            </p>
          )}
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

export default BranchForm;