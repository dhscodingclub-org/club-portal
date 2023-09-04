import { Combobox } from "@headlessui/react";
import { useState } from "react";

interface StudentInfo {
  name: string;
  email: string;
  graduation: string;
}

interface MandatoryStudentComboboxProps {
  label: string;
  placeholder: string;
  id: string;
  options: StudentInfo[];
}

export default function MandatoryStudentCombobox(
  props: MandatoryStudentComboboxProps
) {
  const [unfilledAlert, setUnfilledAlert] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [query, setQuery] = useState("");

  const filteredStudents =
    query === ""
      ? props.options
      : props.options.filter((student) => {
          return ("@" + student.email + student.name + student.graduation)
            .toLowerCase()
            .replace(/\s+/g, "")
            .includes(query.toLowerCase().replace(/\s+/g, ""));
        });

  return (
    <div className="w-full px-3">
      <Combobox value={selectedStudent} onChange={setSelectedStudent} nullable>
        <Combobox.Label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
          {props.label} *
        </Combobox.Label>
        <Combobox.Input
          className={`appearance-none block w-full bg-gray-200 text-gray-700 border ${
            unfilledAlert ? "border-red-500" : "border-gray-200"
          } rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white`}
          displayValue={(student: StudentInfo) => student.name}
          onChange={(event) => {
            setQuery(event.target.value);
            setUnfilledAlert(event.target.value.length == 0);
          }}
          onBlur={(e) => setUnfilledAlert(e.target.value.length == 0)}
          placeholder={props.placeholder}
        />
        <Combobox.Options className="relative mt-1 max-h-60 w-full overflow-auto rounded bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {filteredStudents.map((student) => (
            <Combobox.Option
              key={student.email}
              value={student}
              className={({ active }) =>
                `relative cursor-pointer py-3 px-4 ${
                  active ? "bg-blue-600 text-white" : "text-gray-700"
                }`
              }
            >
              <span>{student.name}</span>
              <span className="ml-2 text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap">
                '{student.graduation}, {student.email}
              </span>
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox>
      <p
        className={`text-red-500 text-xs italic ${
          !unfilledAlert ? "hidden" : ""
        }`}
      >
        Please fill out this field.
      </p>
    </div>
  );
}
