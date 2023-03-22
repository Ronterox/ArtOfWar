import { useEffect, useRef, useState } from "preact/hooks";
import book from "./book.txt";
import "./app.css";

function Chapter({ title, texts }: { title: string; texts: string[] }) {
	const [show, setShow] = useState(false);
	const [read, setRead] = useState<boolean[]>(Array(texts.length).fill(false));
	const chapterRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		chapterRef.current = document.getElementById(title);

		const localRead = localStorage.getItem(title);
		if (localRead) setRead(JSON.parse(localRead));
	}, []);

	useEffect(() => {
		const className = "opacity-50";

		if (read.every((val) => val)) chapterRef.current?.classList.add(className);
		else chapterRef.current?.classList.remove(className);

		localStorage.setItem(title, JSON.stringify(read));
	}, [read]);

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
