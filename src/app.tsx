import { StateUpdater, useEffect, useRef, useState } from "preact/hooks";
import { ChangeEvent } from "preact/compat";
import book from "./book.txt";
import "./app.css";

function loadStorage(key: string, setter: StateUpdater<any>) {
	const value = localStorage.getItem(key);
	if (value) setter(JSON.parse(value));
}

const saveStorage = (key: string, value: any) => localStorage.setItem(key, JSON.stringify(value));

function Chapter({ title, texts }: { title: string; texts: string[] }) {
	const [show, setShow] = useState(false);
	const [read, setRead] = useState<boolean[]>(Array(texts.length).fill(false));
	const [notes, setNotes] = useState<string[]>(Array(texts.length).fill(""));
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
	}, [read]);

	useEffect(() => {
		saveStorage(`${title}-notes`, notes);
	}, [notes]);

	function handleNotesChange(e: ChangeEvent<HTMLInputElement>, index: number) {
		setNotes((old) => {
			const newNotes = [...old];
			newNotes[index] = e.currentTarget.value;
			return newNotes;
		});
	}

	return (
		<div id={title} className="m-10 bg-rose-600 rounded-2xl p-4">
			<button onClick={() => setShow((val) => !val)} className={"font-bold text-white text-3xl m-2 bg-rose-600 w-full hover:bg-rose-900"}>
				{title}
			</button>
			{show
				? texts.map((text, index) => (
						<>
							<button
								key={index}
								onClick={() =>
									setRead((old) => {
										const newRead = [...old];
										newRead[index] = !newRead[index];
										return newRead;
									})
								}
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

	useEffect(() => { fetch(book).then(response => response.text().then(setTextToChapters)); }, []);

	function setTextToChapters(text: string) {
		const chapters: Chapters = {};
		let currentChapter = "";
		for (const line of text.split("\n")) {
			if (!isNaN(parseInt(line[0]))) chapters[currentChapter].push(line);
			else {
				currentChapter = line;
				chapters[currentChapter] = [];
			}
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

	return (
		<div className="app">
			<h1 className="font-bold text-white">The art of war</h1>
			<h2 className="font-bold text-white">Sun Tzu</h2>
			<iframe
				className={"my-3"}
				width="560"
				height="315"
				src="https://www.youtube-nocookie.com/embed/fDAnmujWlsM"
				title="YouTube video player"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
			></iframe>
			<button className={"font-bold text-white text-3xl m-2 bg-rose-600 w-full hover:bg-rose-900"} onClick={() => downloadNotes()}>
				Download Notes
			</button>
			{Object.keys(chapters).map((chapter, index) => (
				<Chapter key={index} title={chapter} texts={chapters[chapter]} />
			))}
		</div>
	);
}
