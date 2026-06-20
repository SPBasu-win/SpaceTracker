export interface Milestone {
  id: string
  year: number
  title: string
  category: 'Human Spaceflight' | 'Moon Exploration' | 'Space Stations' | 'Telescopes' | 'Mars Exploration' | 'Commercial Spaceflight' | 'Megaconstellations' | 'Deep Space Missions' | 'Planetary Exploration' | 'Orbital Growth'
  summary: string
  whyThisMattered: string
  focusCoordinates: {
    latitude: number
    longitude: number
    altitude: number // Camera altitude in meters
  }
  illustration?: string
  visualSequence?: 'sputnik_launch' | 'apollo_moon' | 'iss_assemble' | 'starlink_deploy' | 'jwst_l2' | null
  shortNarration: string
  tags: string[]
}

export const milestones: Milestone[] = [
  {
    id: 'sputnik-1',
    year: 1957,
    title: 'Sputnik 1',
    category: 'Orbital Growth',
    summary: 'The Soviet Union launches the first artificial satellite into orbit, sending simple radio beeps that could be heard around the globe.',
    whyThisMattered: 'This single event ignited the Space Race, proving space travel was possible and altering the course of modern history.',
    focusCoordinates: { latitude: 45.96, longitude: 63.30, altitude: 2000000 },
    visualSequence: 'sputnik_launch',
    shortNarration: 'On October 4th, 1957, Sputnik 1 became the first artificial satellite in history, opening the Space Age.',
    tags: ['satellite', 'soviet', 'sputnik']
  },
  {
    id: 'vostok-1',
    year: 1961,
    title: 'Vostok 1',
    category: 'Human Spaceflight',
    summary: 'Soviet cosmonaut Yuri Gagarin becomes the first human in space, completing a single 108-minute orbit around Earth.',
    whyThisMattered: 'It shattered limits on human potential and catalyzed the American commitment to land a man on the Moon.',
    focusCoordinates: { latitude: 45.96, longitude: 63.30, altitude: 1200000 },
    visualSequence: null,
    shortNarration: 'On April 12th, 1961, Yuri Gagarin circled Earth, demonstrating that humanity could survive in space.',
    tags: ['human', 'soviet', 'gagarin']
  },
  {
    id: 'apollo-11',
    year: 1969,
    title: 'Apollo 11 Moon Landing',
    category: 'Moon Exploration',
    summary: 'NASA astronauts Neil Armstrong and Buzz Aldrin land the Eagle module on the lunar surface, taking the first human steps on another world.',
    whyThisMattered: 'Achieved the decade-long national goal set by JFK, demonstrating unparalleled technological and logistical capability.',
    focusCoordinates: { latitude: 0.67, longitude: 23.47, altitude: 15000000 }, // High altitude to represent Moon view
    visualSequence: 'apollo_moon',
    shortNarration: 'On July 20th, 1969, Neil Armstrong took one small step for man, and one giant leap for mankind.',
    tags: ['moon', 'apollo', 'usa']
  },
  {
    id: 'salyut-1',
    year: 1971,
    title: 'Salyut 1',
    category: 'Space Stations',
    summary: 'The Soviet Union launches the world\'s first space station, Salyut 1, establishing a semi-permanent research laboratory in low Earth orbit.',
    whyThisMattered: 'It shifted focus from short voyages to long-duration human spaceflight and scientific research in microgravity.',
    focusCoordinates: { latitude: 45.96, longitude: 63.30, altitude: 1000000 },
    visualSequence: null,
    shortNarration: 'In April 1971, Salyut 1 became the first operational outpost in orbit, setting the stage for modular space stations.',
    tags: ['station', 'soviet', 'salyut']
  },
  {
    id: 'skylab',
    year: 1973,
    title: 'Skylab',
    category: 'Space Stations',
    summary: 'America launches its first space station, Skylab, repurposed from a Saturn V upper stage, hosting three successive crews.',
    whyThisMattered: 'Proved humans could live and work productively in space for months, conducting solar research and biomedical experiments.',
    focusCoordinates: { latitude: 28.39, longitude: -80.60, altitude: 1200000 },
    visualSequence: null,
    shortNarration: 'Launched in May 1973, Skylab was America\'s first workshop in space, paving the way for international orbital science.',
    tags: ['station', 'usa', 'skylab']
  },
  {
    id: 'voyager-program',
    year: 1977,
    title: 'Voyager Program',
    category: 'Deep Space Missions',
    summary: 'Voyager 1 and 2 are launched to conduct a grand tour of the outer planets, eventually crossing into interstellar space.',
    whyThisMattered: 'Returned the first close-up details of Jupiter, Saturn, Uranus, and Neptune, and remains humanity\'s furthest explorer.',
    focusCoordinates: { latitude: 28.39, longitude: -80.60, altitude: 5000000 },
    visualSequence: null,
    shortNarration: 'In 1977, the Voyager probes departed Earth on a journey to the outer planets and the stars beyond.',
    tags: ['probe', 'voyager', 'deepspace']
  },
  {
    id: 'space-shuttle',
    year: 1981,
    title: 'First Space Shuttle Flight',
    category: 'Human Spaceflight',
    summary: 'Space Shuttle Columbia launches on STS-1, debuting the world\'s first reusable winged spacecraft.',
    whyThisMattered: 'Lowered launch preparation cycles and enabled cargo return, satellite repairs, and space station assembly.',
    focusCoordinates: { latitude: 28.57, longitude: -80.65, altitude: 900000 },
    visualSequence: null,
    shortNarration: 'On April 12th, 1981, the flight of Columbia inaugurated the Shuttle era, bringing wings to space travel.',
    tags: ['shuttle', 'reusable', 'usa']
  },
  {
    id: 'hubble-telescope',
    year: 1990,
    title: 'Hubble Space Telescope',
    category: 'Telescopes',
    summary: 'Space Shuttle Discovery deploys the Hubble Space Telescope into orbit, free from the blurring effects of Earth\'s atmosphere.',
    whyThisMattered: 'Revolutionized astronomy, capturing deep-field galaxies and measuring the expansion rate of the universe.',
    focusCoordinates: { latitude: 28.45, longitude: -80.53, altitude: 1100000 },
    visualSequence: null,
    shortNarration: 'Deployed in 1990, Hubble opened a crystal-clear window into the cosmos, capturing light from the dawn of time.',
    tags: ['telescope', 'hubble', 'orbit']
  },
  {
    id: 'iss-assembly',
    year: 1998,
    title: 'ISS Assembly Begins',
    category: 'Space Stations',
    summary: 'The Russian Zarya module launches, followed by the American Unity module, starting construction of the International Space Station.',
    whyThisMattered: 'The largest international science partnership in history, maintaining a continuous human presence in space since 2000.',
    focusCoordinates: { latitude: 51.64, longitude: 33.04, altitude: 1500000 },
    visualSequence: 'iss_assemble',
    shortNarration: 'In 1998, the launch of Zarya marked the beginning of assembly for the International Space Station.',
    tags: ['station', 'iss', 'international']
  },
  {
    id: 'spaceshipone',
    year: 2004,
    title: 'SpaceShipOne',
    category: 'Commercial Spaceflight',
    summary: 'The privately funded SpaceShipOne reaches space twice in two weeks, winning the $10 million Ansari X Prize.',
    whyThisMattered: 'Broke the state monopoly on space travel, proving private enterprise could build suborbital passenger craft.',
    focusCoordinates: { latitude: 35.05, longitude: -118.15, altitude: 500000 },
    visualSequence: null,
    shortNarration: 'In 2004, SpaceShipOne made history as the first private crewed spacecraft to cross the boundary of space.',
    tags: ['commercial', 'suborbital', 'x-prize']
  },
  {
    id: 'dragon-iss',
    year: 2012,
    title: 'Dragon Docks with ISS',
    category: 'Commercial Spaceflight',
    summary: 'SpaceX\'s Dragon capsule becomes the first commercial spacecraft to fly cargo and dock with the ISS.',
    whyThisMattered: 'Initiated the shift to commercial services for orbital logistics, establishing SpaceX as a primary partner for NASA.',
    focusCoordinates: { latitude: 28.49, longitude: -80.58, altitude: 1000000 },
    visualSequence: null,
    shortNarration: 'In May 2012, SpaceX Dragon became the first private spacecraft to dock with the International Space Station.',
    tags: ['commercial', 'spacex', 'iss']
  },
  {
    id: 'falcon-heavy',
    year: 2018,
    title: 'Falcon Heavy Demonstration',
    category: 'Commercial Spaceflight',
    summary: 'SpaceX launches its heavy-lift Falcon Heavy booster, landing two side boosters simultaneously back on Earth.',
    whyThisMattered: 'Dramatically lowered the cost of heavy-lift payloads and captured global interest by launching a red sports car into deep space.',
    focusCoordinates: { latitude: 28.57, longitude: -80.65, altitude: 1200000 },
    visualSequence: null,
    shortNarration: 'In February 2018, the Falcon Heavy launch demonstrated massive lifting capacity and synchronized booster landings.',
    tags: ['reusable', 'spacex', 'heavy-lift']
  },
  {
    id: 'starlink-deployment',
    year: 2019,
    title: 'Starlink Deployment Begins',
    category: 'Megaconstellations',
    summary: 'SpaceX launches its first large batch of 60 operational Starlink satellites, beginning construction of a global internet constellation.',
    whyThisMattered: 'Marked the dawn of megaconstellation space operations, vastly increasing the number of active satellites in LEO.',
    focusCoordinates: { latitude: 0.0, longitude: 0.0, altitude: 4500000 },
    visualSequence: 'starlink_deploy',
    shortNarration: 'In 2019, SpaceX began deployment of Starlink, initiating the age of orbital megaconstellations.',
    tags: ['internet', 'constellation', 'spacex']
  },
  {
    id: 'jwst-launch',
    year: 2021,
    title: 'James Webb Space Telescope',
    category: 'Telescopes',
    summary: 'The James Webb Space Telescope launches, traveling to the Sun-Earth L2 Lagrange point to peer deep into the infrared universe.',
    whyThisMattered: 'Humanity\'s premier space science observatory, designed to capture the birth of the very first stars and galaxies.',
    focusCoordinates: { latitude: 5.24, longitude: -52.77, altitude: 8000000 }, // High altitude to represent L2 transition
    visualSequence: 'jwst_l2',
    shortNarration: 'On December 25th, 2021, the James Webb Space Telescope launched to L2, opening a new infrared window on the cosmos.',
    tags: ['telescope', 'deepspace', 'jwst']
  },
  {
    id: 'artemis-i',
    year: 2022,
    title: 'Artemis I',
    category: 'Moon Exploration',
    summary: 'NASA launches the Space Launch System rocket carrying the uncrewed Orion spacecraft on a 25-day lunar test flight.',
    whyThisMattered: 'Opened NASA\'s Artemis campaign to return humans to the Moon, testing deep-space navigation and high-speed lunar reentry.',
    focusCoordinates: { latitude: 28.57, longitude: -80.65, altitude: 15000000 },
    visualSequence: null,
    shortNarration: 'In November 2022, Artemis I demonstrated the flight systems that will soon return humanity to the Moon.',
    tags: ['moon', 'orion', 'sls']
  }
]
