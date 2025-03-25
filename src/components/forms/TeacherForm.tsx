"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { Dispatch, SetStateAction, useEffect } from "react";
import { teacherSchema, TeacherSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createTeacher, updateTeacher } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const TeacherForm = ({
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
  } = useForm<TeacherSchema>({
    resolver: zodResolver(teacherSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createTeacher : updateTeacher,
    {
      success: false,
      error: false,
    }
  );

  const router = useRouter();
  useEffect(() => {
    if (type === "update" && data?.name) {
      const [suffix, ...rest] = data.name.split(" ");
      const nameWithoutSuffix = rest.join(" ");
      setValue("suffix", suffix);
      setValue("name", nameWithoutSuffix);
    }
  }, [data, type, setValue]);

  const onSubmit = handleSubmit((formData) => {
    const fullName = `${formData.suffix} ${formData.name}`;
    const payload = {
      ...formData,
      name: fullName.toUpperCase(),
    };

    formAction(payload);
  });

  useEffect(() => {
    if (state.success) {
      toast(`Teacher has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { subjects, branches } = relatedData;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new teacher" : "Update the teacher"}
      </h1>
      <span className="text-xs text-gray-400 font-medium">
        Authentication Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Username"
          name="username"
          defaultValue={data?.username}
          register={register}
          error={errors?.username}
        />
        <InputField
          label="Email"
          name="email"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          defaultValue={data?.password}
          register={register}
          error={errors?.password}
        />
      </div>
      <span className="text-xs text-gray-400 font-medium">
        Personal Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        {/* Suffix Dropdown */}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Prefix</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("suffix")}
            defaultValue={data?.suffix || "Mr."}
          >
            <option value="MR.">MR.</option>
            <option value="MS.">MS.</option>
            <option value="MRS.">MRS.</option>
            <option value="DR.">DR.</option>
          </select>
          {errors.suffix?.message && (
            <p className="text-xs text-red-400">
              {errors.suffix.message.toString()}
            </p>
          )}
        </div>

        {/* Name Field */}
        <InputField
          label="Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors.name}
        />

        <InputField
          label="Phone"
          name="phone"
          defaultValue={data?.phone}
          register={register}
          error={errors.phone}
        />
        <InputField
          label="Division"
          name="division"
          defaultValue={data?.division}
          register={register}
          error={errors.division}
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
      </div>
       {/* <div className="flex flex-col gap-2 w-full md:w-1/4">
           <label className="text-xs text-gray-500">Subjects</label>
           <select
             multiple
             className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
             {...register("subjects")}
             defaultValue={data?.subjects}
           >
             {subjects.map((subject: { id: number; name: string }) => (
               <option value={subject.id} key={subject.id}>
                 {subject.name}
               </option>
             ))}
           </select>
           {errors.subjects?.message && (
             <p className="text-xs text-red-400">
               {errors.subjects.message.toString()}
             </p>
           )}
         </div> */}
         <div className="flex flex-col gap-2 w-full md:w-1/4">
           <label className="text-xs text-gray-500">Branch</label>
           <select
             multiple
             className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
             {...register("branches")}
             defaultValue={data?.branches}
           >
             {branches.map((branch: { id: number; name: string }) => (
               <option value={branch.id} key={branch.id}>
                 {branch.name}
               </option>
             ))}
           </select>
           {errors.branches?.message && (
             <p className="text-xs text-red-400">
               {errors.branches.message.toString()}
             </p>
           )}
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

export default TeacherForm;