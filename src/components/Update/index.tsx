import React, { ChangeEvent, FC, useState } from 'react';

export const Update: FC = () => {
	const [file, setFile] = useState<File>();

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files.length > 0) {
			setFile(event.target.files[0]);
		}
	};

	const handleUpload = async () => {
		if (file) {
			const formData = new FormData();
			formData.append('file', file);

			try {
				const response = await fetch('https://kvadratnikitosa.ru/upload', {
					method: 'POST',
					body: formData,
				});

				if (response.ok) {
					console.log('File uploaded successfully');
				} else {
					console.error('File upload failed', response.statusText);
				}
			} catch (error) {
				console.error('Error uploading file', error);
			}
		}
	};

	return (
		<div>
			<input type="file" accept=".bin" onChange={handleFileChange} />
			<button onClick={handleUpload} disabled={!file}>
				Upload!
			</button>
		</div>
	);
};
