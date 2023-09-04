import { type LoaderArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import MandatoryStudentCombobox from "~/components/MandatoryStudentCombobox";
import MandatoryTextArea from "~/components/MandatoryTextArea";
import MandatoryInput from "~/components/MandatoryTextInput";
import { lastRequestTime } from "~/cookies.server";
import { db } from "~/utils/db.server";

// TODO: find a better name for this
interface StudentInfo {
  name: string;
  email: string;
  graduation: string;
}

// TODO: rename this too probably
interface TeacherInfo {
  name: string;
  email: string;
}

// TODO: name is not representative of what this actually does
let didRequest = false;

export async function loader({ request }: LoaderArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const cookie = (await lastRequestTime.parse(cookieHeader)) || 0;
  const sinceDate = new Date(cookie);
  const newRequestDate = Date.now();

  const rawStudents = await db.student.findMany({
    where: {
      updatedAt: {
        gte: sinceDate,
      },
    },
    select: {
      name: true,
      email: true,
      graduation: true,
    },
  });
  const students = rawStudents.map((e) => {
    return {
      name: e.name,
      email: e.email,
      graduation: e.graduation.getFullYear().toString().slice(-2),
    };
  });

  const teachers = await db.teacher.findMany({
    where: {
      updatedAt: {
        gte: sinceDate,
      },
    },
    select: {
      name: true,
      email: true,
    },
  });

  return json(
    { students: students, teachers: teachers },
    {
      headers: {
        "Set-Cookie": await lastRequestTime.serialize(newRequestDate),
      },
    }
  );
}

export default function NewClub() {
  // Utility code for merging the old with the new
  function mergeArrays<T extends { email: string }>(
    newArray: Array<T>,
    oldArray: Array<T>
  ) {
    // Create a dictionary using email as the key for elements in newArray
    const dict: {
      [key: string]: T;
    } = {};
    newArray.forEach((item) => {
      dict[item.email] = item;
    });

    // Iterate through oldArray and merge it into the dictionary
    oldArray.forEach((item) => {
      if (!dict[item.email]) {
        // If email doesn't exist in dict, add it
        dict[item.email] = item;
      }
    });

    // Convert the dictionary values back to an array
    const mergedList = Object.values(dict);

    return mergedList;
  }

  const { students: newStudents, teachers: newTeachers } =
    useLoaderData<typeof loader>();
  const [students, setStudents] = useState([] as StudentInfo[]);
  const [teachers, setTeachers] = useState([] as TeacherInfo[]);
  useEffect(() => {
    if (!didRequest) {
      didRequest = true;

      // Merge new students with old students
      const oldStudents = JSON.parse(
        localStorage.getItem("students") ?? "[]"
      ) as StudentInfo[];
      setStudents(mergeArrays(newStudents, oldStudents));

      // Do the same with teachers
      const oldTeachers = JSON.parse(localStorage.getItem("teachers") ?? "[]");
      setTeachers(mergeArrays(newTeachers, oldTeachers));
    }
    // @below: trust me bro
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem("students", JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem("teachers", JSON.stringify(teachers));
  }, [teachers]);

  return (
    <form className="w-full max-w-lg m-auto" method="post">
      <div className="flex flex-wrap -mx-3 mb-6">
        <MandatoryInput
          label="Club Name"
          placeholder="Lunch Reheating Club"
          id="club-name"
          type="text"
        />
      </div>
      <div className="flex flex-wrap -mx-3 mb-6">
        <MandatoryTextArea
          label="Description"
          placeholder="A club dedicated to augmenting the lunch experience of students at Davis High, ..."
          id="description"
        />
      </div>
      <div className="flex flex-wrap -mx-3 mb-6">
        <MandatoryInput
          label="President Email"
          placeholder="bq76910@djusdstudents.org"
          id="president-email"
          type="email"
        />
      </div>
      <div className="flex flex-wrap -mx-3 mb-6">
        <MandatoryStudentCombobox
          label="Choose Student"
          placeholder="Ver Vermillion"
          id="choose-student"
          options={students}
        />
      </div>
      <ul>
        {students?.map((student) => (
          <>
            <li>{student.name}</li>
            <li>{student.email}</li>
            <li>{student.graduation}</li>
          </>
        ))}
      </ul>
    </form>
  );
}
