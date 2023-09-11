import {
  type ActionArgs,
  json,
  type LoaderArgs,
  redirect,
} from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import React, { useEffect, useState } from "react";
import { lastRequestTime } from "~/cookies.server";
import { db } from "~/utils/db.server";
import Autocomplete from "@mui/material/Autocomplete";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import moment from "moment";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import ListItemButton from "@mui/material/ListItemButton";
import TextField from "@mui/material/TextField";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListSubheader from "@mui/material/ListSubheader";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";

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

// TODO: these types actually need to be figured out
const Frequency = Object.freeze({
  DAILY: ["Daily", "day"],
  WEEKLY: ["Weekly", "week"],
  MONTHLY: ["Monthly", "month"],
});

// TODO: same here (that todo above used to be for this one)
interface MeetingInfo {
  uuid: string;
  location: string;
  startingDate: moment.Moment;
  recurInterval: number;
  recurFrequency: keyof typeof Frequency;
}

// TODO: name is not representative of what this actually does
let didRequest = false;

const classrooms = ["S-09"]; // TODO: add the rest of the classrooms here

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
    },
  );
}

export const action = async ({ request }: ActionArgs) => {
  // TODO: refactor this code
  const form = await request.formData();
  const name = form.get("club-name");
  const description = form.get("description");
  const founder = form.get("founder");
  const presidents = form.get("presidents");
  const vicePresidents = form.get("vice-presidents");
  const secretaryTreasurer = form.get("sec-treas");
  const officers = form.get("officers");
  const advisor = form.get("advisor");
  const approved = form.get("approved");
  const meetings = form.get("meetings");

  if (
    typeof name !== "string" ||
    typeof description !== "string" ||
    typeof founder !== "string" ||
    typeof advisor !== "string"
  ) {
    return json(null, { status: 400 });
  }

  console.log(`a`);
  // TODO: implement this route
  return redirect("/clubs");
};

function FormDialog({
  meetings,
  setMeetings,
}: {
  meetings: MeetingInfo[];
  setMeetings: React.Dispatch<React.SetStateAction<MeetingInfo[]>>;
}) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState(moment() as moment.Moment | null);
  const [location, setLocation] = useState(null as string | null);
  const [interval, setInterval] = useState(1 as any);
  const [frequency, setFrequency] = useState(
    "WEEKLY" as keyof typeof Frequency | null,
  );
  const [errorStartDate, setErrorStartDate] = useState("");
  const [errorLocation, setErrorLocation] = useState("");
  const [errorInterval, setErrorInterval] = useState("");
  const [errorFrequency, setErrorFrequency] = useState("");

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
    // Reset all the fields
    setStartDate(moment());
    setLocation(null);
    setInterval(1);
    setFrequency("WEEKLY");
  };

  const handleSubmit = () => {
    let isError = false;
    if (!startDate) {
      isError = true;
      setErrorStartDate("Starting date is required");
    }
    if (!location) {
      isError = true;
      setErrorLocation("Location is required");
    }
    if (
      interval == null ||
      !Number.isInteger(Number(interval)) ||
      Number(interval) <= 0
    ) {
      isError = true;
      setErrorInterval("Interval is required and should be a positive integer");
    }
    if (!frequency) {
      isError = true;
      setErrorFrequency("Frequency is required");
    }
    if (isError) {
      return;
    }

    setMeetings([
      ...meetings,
      {
        uuid: crypto.randomUUID(),
        startingDate: startDate!,
        location: location!,
        recurInterval: interval,
        recurFrequency: frequency!,
      },
    ]);
    setOpen(false);
    // Reset all the fields
    setStartDate(moment());
    setLocation(null);
    setInterval(1);
    setFrequency("WEEKLY");
  };

  return (
    <div>
      <ListItemButton onClick={handleClickOpen}>
        New Meeting Time
      </ListItemButton>
      <Dialog open={open} onClose={handleCancel}>
        <DialogTitle>Meeting Information</DialogTitle>
        <DialogContent>
          <DatePicker
            label="Starting Date"
            value={startDate}
            onChange={(newDate) => setStartDate(newDate)}
            slotProps={{
              textField: {
                required: true,
                error: !!errorStartDate,
                helperText: errorStartDate,
                fullWidth: true,
                margin: "normal",
              },
            }}
            autoFocus
          />
          <Autocomplete
            renderInput={(params) => (
              <TextField
                {...params}
                label="Location"
                margin="normal"
                required
                error={!!errorLocation}
                helperText={errorLocation}
              />
            )}
            options={classrooms}
            value={location}
            onChange={(_e, newLocation) => {
              setLocation(newLocation);
              setErrorLocation("");
            }}
            freeSolo
            fullWidth
          />
          <TextField
            label="Interval"
            type="number"
            margin="normal"
            value={interval}
            error={!!errorInterval}
            helperText={errorInterval}
            onChange={(e) => {
              setInterval(e.target.value);
            }}
            fullWidth
          />
          <Autocomplete
            renderInput={(params) => (
              <TextField
                {...params}
                label="Frequency"
                margin="normal"
                required
                error={!!errorFrequency}
                helperText={errorFrequency}
              />
            )}
            options={
              ["DAILY", "WEEKLY", "MONTHLY"] as (keyof typeof Frequency)[]
            }
            getOptionLabel={(option) => Frequency[option][0]}
            value={frequency}
            onChange={(_e, newFrequency) => setFrequency(newFrequency)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSubmit}>Add</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default function AddExistingClub() {
  // Utility code for merging the old with the new
  function mergeArrays<T extends { email: string }>(
    newArray: Array<T>,
    oldArray: Array<T>,
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
    return Object.values(dict);
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
        localStorage.getItem("students") ?? "[]",
      ) as StudentInfo[];
      setStudents(mergeArrays(newStudents, oldStudents));

      // Do the same with teachers
      const oldTeachers = JSON.parse(localStorage.getItem("teachers") ?? "[]");
      setTeachers(mergeArrays(newTeachers, oldTeachers));
    }
    // @below: trust me bro
    // Only run this effect once (on initial render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem("students", JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem("teachers", JSON.stringify(teachers));
  }, [teachers]);

  const [meetings, setMeetings] = useState([] as MeetingInfo[]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Form className="w-full lg:max-w-3xl m-auto" method="post">
        <Typography variant="h2">Add an existing club</Typography>
        <TextField
          name="club-name"
          label="Club Name"
          type="text"
          margin="normal"
          fullWidth
          required
          autoFocus
        />
        <TextField
          name="description"
          label="Description"
          multiline
          minRows={4}
          type="text"
          margin="normal"
          fullWidth
          required
        />
        <Autocomplete
          renderInput={(params) => (
            <TextField
              {...params}
              name="founder"
              label="Founder"
              margin="normal"
              required
            />
          )}
          options={students}
          getOptionLabel={(student) =>
            `${student.name} '${student.graduation}, @${student.email}`
          }
          filterSelectedOptions
          fullWidth
        />
        <Autocomplete
          options={students}
          getOptionLabel={(student) =>
            `${student.name} '${student.graduation}, @${student.email}`
          }
          filterSelectedOptions
          renderInput={(params) => (
            <TextField
              {...params}
              name="presidents"
              label="Presidents"
              margin="normal"
              required
            />
          )}
          multiple
          fullWidth
        />
        <Autocomplete
          renderInput={(params) => (
            <TextField
              {...params}
              name="vice-presidents"
              label="Vice Presidents"
              margin="normal"
            />
          )}
          options={students}
          getOptionLabel={(student) =>
            `${student.name} '${student.graduation}, @${student.email}`
          }
          filterSelectedOptions
          multiple
          fullWidth
        />
        <Autocomplete
          renderInput={(params) => (
            <TextField
              {...params}
              name="sec-treas"
              label="Secretary/Treasurer"
              margin="normal"
            />
          )}
          options={students}
          getOptionLabel={(student) =>
            `${student.name} '${student.graduation}, @${student.email}`
          }
          filterSelectedOptions
          multiple
          fullWidth
        />
        <Autocomplete
          renderInput={(params) => (
            <TextField
              {...params}
              name="officers"
              label="Officers"
              margin="normal"
            />
          )}
          options={students}
          getOptionLabel={(student) =>
            `${student.name} '${student.graduation}, @${student.email}`
          }
          filterSelectedOptions
          multiple
          fullWidth
        />
        <Autocomplete
          renderInput={(params) => (
            <TextField
              {...params}
              name="advisor"
              label="Advisor"
              margin="normal"
              required
            />
          )}
          options={teachers}
          getOptionLabel={(teacher) => `${teacher.name} @${teacher.email}`}
          filterSelectedOptions
          fullWidth
        />
        <FormControlLabel
          control={<Checkbox name="approved" />}
          label="Approved for this school year"
        />
        <List subheader={<ListSubheader>Meeting Times</ListSubheader>}>
          {meetings.map((meeting) => (
            <ListItem key={meeting.uuid}>
              <ListItemText
                primary={`Every ${
                  meeting.recurInterval > 1 ? meeting.recurInterval + " " : ""
                }${Frequency[meeting.recurFrequency][1]}${
                  meeting.recurInterval > 1 ? "s" : ""
                } on ${meeting.startingDate.format("dddd")} at ${
                  meeting.location
                }, starting ${meeting.startingDate.format("M/D/YYYY")}`}
              />
              {/* TODO: Make these open an editing dialog and remove the entry, respectively */}
              <IconButton edge="end">
                <span className="material-symbols-outlined">edit</span>
              </IconButton>
              <IconButton edge="end">
                <span className="material-symbols-outlined">delete</span>
              </IconButton>
            </ListItem>
          ))}
          <FormDialog meetings={meetings} setMeetings={setMeetings} />
        </List>
        <input type="hidden" value={JSON.stringify(meetings)} name="meetings" />
        <Button variant="contained" type="submit">
          Submit
        </Button>
      </Form>
    </div>
  );
}
