import {json, type LoaderArgs} from "@remix-run/node";
import {Form, useLoaderData} from "@remix-run/react";
import React, {useEffect, useState} from "react";
import {lastRequestTime} from "~/cookies.server";
import {db} from "~/utils/db.server";
import {
  Autocomplete,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormLabel,
  IconButton, List, ListItem, ListItemButton, ListItemText, ListSubheader,
  Stack,
  TextField, Typography
} from "@mui/material";
import {DatePicker} from "@mui/x-date-pickers";
import moment from "moment";

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
  DAILY: ["Daily", "day"], WEEKLY: ["Weekly", "week"], MONTHLY: ["Monthly", "month"]
})

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

const classrooms = ["S-09"] // TODO: add the rest of the classrooms here

export async function loader({request}: LoaderArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const cookie = (await lastRequestTime.parse(cookieHeader)) || 0;
  const sinceDate = new Date(cookie);
  const newRequestDate = Date.now();

  const rawStudents = await db.student.findMany({
    where: {
      updatedAt: {
        gte: sinceDate,
      },
    }, select: {
      name: true, email: true, graduation: true,
    },
  });
  const students = rawStudents.map((e) => {
    return {
      name: e.name, email: e.email, graduation: e.graduation.getFullYear().toString().slice(-2),
    };
  });

  const teachers = await db.teacher.findMany({
    where: {
      updatedAt: {
        gte: sinceDate,
      },
    }, select: {
      name: true, email: true,
    },
  });

  return json({students: students, teachers: teachers}, {
    headers: {
      "Set-Cookie": await lastRequestTime.serialize(newRequestDate),
    },
  });
}

function FormDialog({meetings, setMeetings}: { meetings: MeetingInfo[], setMeetings: React.Dispatch<React.SetStateAction<MeetingInfo[]>> }) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState(moment() as moment.Moment | null);
  const [location, setLocation] = useState(null as string | null);
  const [interval, setInterval] = useState(1);
  const [frequency, setFrequency] = useState("WEEKLY" as keyof typeof Frequency | null)
  const [errorStartDate, setErrorStartDate] = useState("");
  const [errorLocation, setErrorLocation] = useState("");
  const [errorInterval, setErrorInterval] = useState("");
  const [errorFrequency, setErrorFrequency] = useState("");

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
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
    if (interval == null || interval <= 0) {
      isError = true;
      setErrorInterval("Interval is required and should be a positive number");
    }
    if (!frequency) {
      isError = true;
      setErrorFrequency("Frequency is required");
    }
    if (isError) {
      return;
    }

    setMeetings([...meetings, {uuid: crypto.randomUUID(), startingDate: startDate!, location: location!, recurInterval: interval, recurFrequency: frequency!}])
    setOpen(false);
    // reset all the fields
    setStartDate(moment())
    setLocation(null)
    setInterval(1)
    setFrequency("WEEKLY")
  }

  return (<div>
    <ListItemButton onClick={handleClickOpen}>
      New Meeting Time
    </ListItemButton>
    <Dialog open={open} onClose={handleCancel}>
      <DialogTitle>Meeting Information</DialogTitle>
      <DialogContent>
        <DatePicker
          label="Starting Date"
          value={startDate}
          onChange={(newDate) => {
            setStartDate(newDate);
            setErrorStartDate(newDate ? "" : "Starting date is required");
          }}
          slotProps={{textField: {required: true, error: !!errorStartDate, helperText: errorStartDate, fullWidth: true, margin: "normal"}}} autoFocus/>
        <Autocomplete renderInput={(params) => (
          <TextField {...params} label="Location" margin="normal" required error={!!errorLocation}
                     helperText={errorLocation}/>)}
                      options={classrooms}
                      value={location}
                      onChange={(_e, newLocation) => {
                        setLocation(newLocation);
                        setErrorLocation("");
                      }}
                      freeSolo fullWidth/>
        <TextField label="Interval"
                   type="number"
                   margin="normal"
                   value={interval}
                   error={!!errorInterval}
                   helperText={errorInterval}
                   onChange={(e) => {
                     let num = Number(e.target.value);

                     setInterval(num);


                     setErrorInterval(Number.isInteger(num) || num <= 0 ? "" : "Interval is required and should be a positive number");

                   }} fullWidth/>
        <Autocomplete renderInput={(params) => (
          <TextField {...params} label="Frequency" margin="normal" required error={!!errorFrequency}
                     helperText={errorFrequency}/>)}
                      options={["DAILY", "WEEKLY", "MONTHLY"] as (keyof typeof Frequency)[]}
                      getOptionLabel={(option) => Frequency[option][0]} value={frequency}
                      onChange={(_e, newFrequency) => {
                        setFrequency(newFrequency);
                        setErrorFrequency("");
                      }} fullWidth/>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>Add</Button>
      </DialogActions>
    </Dialog>
  </div>);
}

export default function NewClub() {
  // Utility code for merging the old with the new
  function mergeArrays<T extends { email: string }>(newArray: Array<T>, oldArray: Array<T>) {
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

  const {students: newStudents, teachers: newTeachers} = useLoaderData<typeof loader>();
  const [students, setStudents] = useState([] as StudentInfo[]);
  const [teachers, setTeachers] = useState([] as TeacherInfo[]);
  useEffect(() => {
    if (!didRequest) {
      didRequest = true;

      // Merge new students with old students
      const oldStudents = JSON.parse(localStorage.getItem("students") ?? "[]") as StudentInfo[];
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

  const [meetings, setMeetings] = useState([] as MeetingInfo[]);

  return (<div className="flex items-center justify-center min-h-screen">
    <Form className="w-full max-w-2xl m-auto" method="post">
      <Typography variant="h1">
        Add an existing club
      </Typography>
      <TextField name="club-name" label="Club Name" type="text" margin="normal" fullWidth required autoFocus/>
      <TextField name="description" label="Description" multiline minRows={4} type="text" margin="normal" fullWidth
                 required/>
      <Autocomplete
        renderInput={(params) => (<TextField {...params} name="founder" label="Founder" margin="normal" required/>)}
        options={students}
        getOptionLabel={(student) => (`${student.name} '${student.graduation}, @${student.email}`)}
        filterSelectedOptions fullWidth/>
      <Autocomplete options={students}
                    getOptionLabel={(student) => (`${student.name} '${student.graduation}, @${student.email}`)}
                    filterSelectedOptions renderInput={(params) => (
        <TextField {...params} name="" label="Presidents" margin="normal" required/>)} multiple fullWidth/>
      <Autocomplete renderInput={(params) => (
        <TextField {...params} name="vice-presidents" label="Vice Presidents" margin="normal"/>)}
                    options={students}
                    getOptionLabel={(student) => (`${student.name} '${student.graduation}, @${student.email}`)}
                    filterSelectedOptions multiple fullWidth/>
      <Autocomplete renderInput={(params) => (
        <TextField {...params} name="sec-treas" label="Secretary/Treasurer" margin="normal"/>)}
                    options={students}
                    getOptionLabel={(student) => (`${student.name} '${student.graduation}, @${student.email}`)}
                    filterSelectedOptions multiple fullWidth/>
      <Autocomplete
        renderInput={(params) => (<TextField {...params} name="officers" label="Officers" margin="normal"/>)}
        options={students}
        getOptionLabel={(student) => (`${student.name} '${student.graduation}, @${student.email}`)}
        filterSelectedOptions multiple fullWidth/>
      <Autocomplete
        renderInput={(params) => (<TextField {...params} name="advisor" label="Advisor" margin="normal" required/>)}
        options={teachers}
        getOptionLabel={(teacher) => (`${teacher.name} @${teacher.email}`)}
        filterSelectedOptions fullWidth/>
      <FormControlLabel control={<Checkbox/>} label="Approved for this school year"/>
      {/*<FormLabel>Meeting Times</FormLabel>*/}
      <List subheader={<ListSubheader>Meeting Times</ListSubheader>}>

          {meetings.map((meeting) => (
            <ListItem key={meeting.uuid}>
              <ListItemText primary={`Every ${meeting.recurInterval > 1 ? meeting.recurInterval + " " : ""}${Frequency[meeting.recurFrequency][1]}${meeting.recurInterval > 1 ? "s" : ""} on ${meeting.startingDate.format("dddd")} at ${meeting.location}, starting ${meeting.startingDate.format("M/D/YYYY")}`} />
              <IconButton edge="end"><span className="material-symbols-outlined">edit</span></IconButton>
              <IconButton edge="end"><span className="material-symbols-outlined">delete</span></IconButton>
            </ListItem>
            ))}
        <FormDialog meetings={meetings} setMeetings={setMeetings}/>
      </List>
      {/*<Stack direction="column">*/}
      {/*  {meetings.map((meeting) => (<Stack direction="row" key={meeting.uuid}>*/}
      {/*    /!*<DatePicker label="Starting Date" value={meeting.startingDate}/>*!/*/}
      {/*    /!*<Autocomplete renderInput={(params) => (<TextField {...params} label="Location" margin="normal" required/>)}*!/*/}
      {/*    /!*              options={classrooms} freeSolo/>*!/*/}
      {/*    /!*<TextField label="Frequency" type="number" margin="normal"/>*!/*/}
      {/*    /!*<Autocomplete renderInput={(params) => (<TextField {...params} label="Interval" margin="normal" required/>)}*!/*/}
      {/*    /!*              options={["DAILY", "WEEKLY", "MONTHLY"] as (keyof typeof Frequency)[]}*!/*/}
      {/*    /!*              getOptionLabel={(option) => Frequency[option]}/>*!/*/}
      {/*    {//*/}
      {/*    }*/}
      {/*    <TextField type="text" margin="normal" InputProps={{readOnly: true}}*/}
      {/*               value={`Every ${meeting.recurInterval > 1 ? meeting.recurInterval + " " : ""}${Frequency[meeting.recurFrequency][1]}${meeting.recurInterval > 1 ? "s" : ""} on ${meeting.startingDate.format("dddd")} at ${meeting.location}, starting ${meeting.startingDate.format("M/D/YYYY")}`}*/}
      {/*               fullWidth/>*/}
      {/*    <IconButton edge="end"><span className="material-symbols-outlined">edit</span></IconButton>*/}
      {/*    <IconButton edge="end"><span className="material-symbols-outlined">delete</span></IconButton>*/}
      {/*  </Stack>))}*/}
      {/*</Stack>*/}
      {/*<FormDialog meetings={meetings} setMeetings={setMeetings}/>*/}
    </Form>
  </div>);
}
