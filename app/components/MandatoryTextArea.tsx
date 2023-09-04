import { useState } from "react";

interface MandatoryTextAreaProps {
  label: string;
  placeholder: string;
  id: string;
}

export default function MandatoryTextArea(props: MandatoryTextAreaProps) {
  const [unfilledAlert, setUnfilledAlert] = useState(false);

  return (
    <div className="w-full px-3">
      <label
        className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
        htmlFor={props.id}
      >
        {props.label} *
      </label>
      <textarea
        className={`appearance-none block w-full bg-gray-200 text-gray-700 border ${
          unfilledAlert ? "border-red-500" : "border-gray-200"
        } rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white`}
        id={props.id}
        placeholder={props.placeholder}
        onChange={(e) => setUnfilledAlert(e.target.value.length == 0)}
        onBlur={(e) => setUnfilledAlert(e.target.value.length == 0)}
      />
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
