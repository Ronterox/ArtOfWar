import { StateUpdater, useEffect, useRef, useState } from "preact/hooks";
import { ChangeEvent } from "preact/compat";
import book from "./book.txt";
import "./app.css";

function loadStorage<T>(key: string, setter: StateUpdater<T>) {
	const value = localStorage.getItem(key);
	if (value) setter(JSON.parse(value));
}

function Chapter({ title, texts }: { title: string; texts: string[] }) {
	const [show, setShow] = useState(false);
	const [read, setRead] = useState<boolean[]>(Array(texts.length).fill(false));
	const [notes, setNotes] = useState<string[]>(Array(texts.length).fill(""));
	const chapterRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		chapterRef.current = document.getElementById(title);
		loadStorage(title, setRead);
		loadStorage(`${title}-notes`, setNotes);
	}, []);

	useEffect(() => {
		const className = "opacity-50";
		const classNames = chapterRef.current!.classList;

		if (read.every((val) => val)) classNames.add(className);
		else classNames.remove(className);

		localStorage.setItem(title, JSON.stringify(read));
	}, [read]);

	useEffect(() => { localStorage.setItem(`${title}-notes`, JSON.stringify(notes)); }, [notes]);

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
							<input
								hidden={!read[index]}
								type="text"
								value={notes[index]}
								className={"bg-white my-2 p-2"}
								placeholder={"Notes"}	
								onChange={(e: ChangeEvent<HTMLInputElement>) => setNotes((old) => [...old.splice(0, index), e.currentTarget.value, ...old])}
							/>
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

	useEffect(() => {
		fetch(book).then((response) => {
			response.text().then((text) => {
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
			});
		});
	}, []);

	return (
		<div className="app">
			<h1 className="font-bold text-white">The art of war</h1>
			<h2 className="font-bold text-white">Sun Tzu</h2>
			{Object.keys(chapters).map((chapter, index) => (
				<Chapter key={index} title={chapter} texts={chapters[chapter]} />
			))}
		</div>
	);
}
