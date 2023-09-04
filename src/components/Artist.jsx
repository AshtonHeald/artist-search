import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, InputGroup, FormControl, Button, Row, Col, Card } from "react-bootstrap";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_CLIENT_SECRET;

const Artist = () => {
	const [searchInput, setSearchInput] = useState("");
	const [accessToken, setAccessToken] = useState("");
	const [artistInfo, setArtistInfo] = useState("");
	const [albums, setAlbums] = useState([]);

	useEffect(() => {
		// API Access Token
		const authParameters = {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: "grant_type=client_credentials&client_id=" + CLIENT_ID + "&client_secret=" + CLIENT_SECRET,
		};
		fetch("https://accounts.spotify.com/api/token", authParameters)
			.then(result => result.json())
			.then(data => setAccessToken(data.access_token))
			.catch(error => console.error("Error obtaining access token:", error));
	}, []);

	async function search() {
		const searchParameters = {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: "Bearer " + accessToken,
			},
		};

		const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchInput)}&type=artist&market=US&limit=1`, searchParameters);
		const data = await response.json();
		const artist = data.artists.items[0];

		if (artist) {
			// Get Artist Details
			const artistDetailsResponse = await fetch(`https://api.spotify.com/v1/artists/${artist.id}`, searchParameters);
			const artistDetailsData = await artistDetailsResponse.json();

			// Get Top Tracks
			const topTracksResponse = await fetch(`https://api.spotify.com/v1/artists/${artist.id}/top-tracks?country=US`, searchParameters);
			const topTracksData = await topTracksResponse.json();

			setArtistInfo({
				name: artistDetailsData.name,
				genre: artistDetailsData.genres[0],
				topTracks: topTracksData.tracks,
				image: artist.images[0]?.url,
			});

			// Get Albums
			const albumsResponse = await fetch(`https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=album&market=US&limit=50`, searchParameters);
			const albumsData = await albumsResponse.json();

			// For each album, fetch release date and tracks
			const albumDetailsPromises = albumsData.items.map(async album => {
				const albumDetailsResponse = await fetch(`https://api.spotify.com/v1/albums/${album.id}`, searchParameters);
				const albumDetailsData = await albumDetailsResponse.json();

				const albumTracksResponse = await fetch(`https://api.spotify.com/v1/albums/${album.id}/tracks`, searchParameters);
				const albumTracksData = await albumTracksResponse.json();

				return {
					id: album.id,
					name: album.name,
					image: album.images[0]?.url,
					releaseDate: albumDetailsData.release_date,
					tracks: albumTracksData.items,
				};
			});

			// Wait for all album details to be fetched
			const albumDetails = await Promise.all(albumDetailsPromises);
			setAlbums(albumDetails);
		}
	}
	return (
		<>
			<Container className="p-3">
				<InputGroup className="mb-3" size="lg">
					<FormControl
						placeholder="Search for Artist"
						type="input"
						onKeyDown={event => {
							if (event.key === "Enter") {
								search();
							}
						}}
						onChange={event => setSearchInput(event.target.value)}
					/>
					<Button onClick={search} className="btn-dark">Search</Button>
				</InputGroup>

				<Row className="row row-cols-1 row-cols-lg-2 row-cols-xl-3 g-3">
					{artistInfo && (
						<Col>
						<Card className="text-bg-dark h-100">
							<Card.Img src={artistInfo.image} alt={artistInfo.name} className="rounded-bottom-0"/>
							<Card.Header>
								<Card.Title>{artistInfo.name}</Card.Title>
								<Card.Subtitle>{artistInfo.genre}</Card.Subtitle>
							</Card.Header>
							<Card.Body>
								<ul className="list-group fw-bold">
								<li className="list-group-item fw-bold rounded-bottom-0">Top Tracks:</li>
								</ul>
								
								<ol className="list-group list-group-numbered">
									{artistInfo.topTracks.map(track => (
										<li key={track.id} className="text-bg-dark list-group-item rounded-top-0">{track.name}</li>
									))}
								</ol>
							</Card.Body>
						</Card>
						</Col>
					)}
					{albums.map(album => (
						<Col key={album.id}>
						<Card className="h-100">
							<Card.Img src={album.image} className="rounded-bottom-0"/>
							<Card.Header>
								<Card.Title>{album.name}</Card.Title>
								<Card.Subtitle>{album.releaseDate}</Card.Subtitle>
							</Card.Header>
							<Card.Body>
								<ol className="list-group list-group-numbered list-group-flush">
									{album.tracks.map((track, index) => (
										<li key={index} className="list-group-item">{track.name}</li>
									))}
								</ol>
							</Card.Body>
						</Card>
						</Col>
					))}
				</Row>
			</Container>
		</>
	);
};

export default Artist;
