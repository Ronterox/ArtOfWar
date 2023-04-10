import { StateUpdater, useEffect, useRef, useState } from "preact/hooks";
import { ChangeEvent } from "preact/compat";
import BOOK from "./book.txt";
import "./app.css";

function loadStorage(key: string, setter: StateUpdater<any>) {
	const value = localStorage.getItem(key);
	if (value) setter(JSON.parse(value));
}

const saveStorage = (key: string, value: any) => localStorage.setItem(key, JSON.stringify(value));

function Chapter({ title, texts, setLastReadId }: { title: string; texts: string[], setLastReadId: StateUpdater<string> }) {
	const [show, setShow] = useState(false);
	const [read, setRead] = useState<boolean[]>(Array(texts.length).fill(false));
	const [notes, setNotes] = useState<string[]>(Array(texts.length).fill(""));
	const [linesRead, setLinesRead] = useState(0)
	const chapterRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		chapterRef.current = document.getElementById(title);
		loadStorage(`${title}-read`, setRead);
		loadStorage(`${title}-notes`, setNotes);
	}, []);

	useEffect(() => {
		const className = "opacity-50";
		const classNames = chapterRef.current!.classList;

		if (read.every((val) => val)) classNames.add(className);
		else classNames.remove(className);

		saveStorage(`${title}-read`, read);
		setLinesRead(read.filter(val => val).length)
	}, [read]);

	useEffect(() => { saveStorage(`${title}-notes`, notes); }, [notes]);

	function handleNotesChange(e: ChangeEvent<HTMLInputElement>, index: number) {
		setNotes((old) => {
			const newNotes = [...old];
			newNotes[index] = e.currentTarget.value;
			return newNotes;
		});
	}

	function handleReadChange(event: ChangeEvent<HTMLButtonElement>, index: number) {
		setLastReadId(event.currentTarget.id)
		setRead((old) => {
			const newRead = [...old];
			newRead[index] = !newRead[index];
			return newRead;
		});
	}

	return (
		<div id={title} className="m-10 bg-rose-600 rounded-2xl p-4">
			<button onClick={() => setShow((val) => !val)} className={"capitalize font-bold text-white text-3xl m-2 bg-rose-600 w-full hover:bg-rose-900"}>
				{title} {show ? "▲" : "▼"}
				<p className={"text-xl"}>{notes.filter(note => note).length} notes</p>
				<p className={"text-xl"}>{linesRead} / {read.length} read ({Math.round(linesRead / read.length * 100)}%)</p>
			</button>
			{show
				? texts.map((text, index) => (
						<>
							<button
								key={index}
								id={`${title}-${index}`}
								onClick={e => handleReadChange(e, index)}
								className={read[index] ? "bg-white opacity-50 rounded p-4" : "bg-white rounded p-4"}
							>
								<p className={"text-xl"}>{text}</p>
							</button>
							<br />
							<input hidden={!read[index]} type="text" value={notes[index]} className={"bg-white my-2 p-2"} placeholder={"Notes"} onChange={(e) => handleNotesChange(e, index)} />
							<br />
							<br />
						</>
				  ))
				: null}
		</div>
	);
}

type Chapters = { [key: string]: string[] };

export function App() {
	const [chapters, setChapters] = useState<Chapters>({});
	const [bookInfo, setBookInfo] = useState({ title: "", desc: "", author: "", video: "" })
	const [lastReadId, setLastReadId] = useState("")

	useEffect(() => { 
		fetch(BOOK).then(response => response.text().then(setTextToChapters)); 
		loadStorage("lastReadId", setLastReadId);
	}, []);
	useEffect(() => { saveStorage("lastReadId", lastReadId); }, [lastReadId]);

	function setTextToChapters(text: string) {
		const chapters: Chapters = {};
		const [title, desc, author] = text.split("\n", 3);
		setBookInfo({ title, desc, author, video: "NZdiH3TrbKU" })
		for (const chapter of text.split("\n\n")) {
			const lines = chapter.split("\n");
			const title = lines[0].split(" ", 3).join(" ");
			chapters[title] = lines;
		}
		setChapters(chapters);
	}

	function downloadNotes() {
		const element = document.createElement("a");

		let text = "";
		for (const chapter of Object.keys(chapters)) {
			text += chapter + "\n";
			const notes = localStorage.getItem(`${chapter}-notes`);
			if (notes) JSON.parse(notes).forEach((note: string) => (text += note + "\n"));
		}

		element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
		element.setAttribute("download", "");
		element.click();
	}

	function scrollToLastRead() {
		if (!lastReadId) return;

		const element = document.getElementById(lastReadId);
		if (element) element.scrollIntoView({ behavior: "smooth" });
		else {
			const chapter = document.getElementById(lastReadId.split("-")[0]);
			if (!chapter) return;
			// @ts-ignore
			chapter.childNodes[0].click();
			chapter.scrollIntoView({ behavior: "smooth" });
		}
	}

	return (
		<div className="app">
			<h1 className="font-bold text-white">{bookInfo.title}</h1>
			<h2 className="font-bold text-white">{bookInfo.author}</h2>
			<p className="font-bold text-white">{bookInfo.desc}</p>
			<iframe
				className={"my-3 w-full"}
				width="560"
				height="315"
				src={`https://www.youtube-nocookie.com/embed/${bookInfo.video}`}
				title="YouTube video player"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
			></iframe>
			<button className={"font-bold text-white text-3xl m-2 bg-rose-600 w-full hover:bg-rose-900"} onClick={() => downloadNotes()}>
				Download Notes
			</button>
			{Object.keys(chapters).map((chapter, index) => (
				<Chapter key={index} title={chapter} texts={chapters[chapter]} setLastReadId={setLastReadId} />
			))}
			<button onClick={scrollToLastRead} className={"sticky bottom-2 w-fit flex border-2 rounded p-2 border-white border-solid font-bold text-white text-3xl bg-rose-600 hover:bg-rose-900"}>Go to Last Read</button>
		</div>
	);
}
