import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Container, Heading, SimpleGrid, Spinner, Text } from '@chakra-ui/react';
import EventCard from '../components/EventCard';
import api from '../api/axiosConfig';

function Events() {
  const [searchParams] = useSearchParams();
  const denaryFilter = searchParams.get('denary');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events')
      .then((response) => {
        const allEvents = response.data.data || [];
        if (denaryFilter) {
          setEvents(allEvents.filter((event) => event.denary === denaryFilter));
        } else {
          setEvents(allEvents);
        }
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [denaryFilter]);

  return (
    <Box py={12}>
      <Container maxW="7xl">
        <Box
          bg="whiteAlpha.85"
          borderRadius="3xl"
          p={{ base: 6, md: 8 }}
          boxShadow="2xl"
          border="1px solid"
          borderColor="whiteAlpha.200"
          backdropFilter="saturate(180%) blur(20px)"
        >
          <Heading mb={2} color="gray.900">Upcoming Events</Heading>
          {denaryFilter && (
            <Text mb={4} color="gray.600">Filtering by denary: <Text as="span" fontWeight="bold">{denaryFilter}</Text></Text>
          )}
          {loading ? (
            <Spinner color="blue.500" />
          ) : events.length ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {events.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </SimpleGrid>
          ) : (
            <Text color="gray.700">No upcoming events scheduled yet.</Text>
          )}
        </Box>
      </Container>
    </Box>
  );
}

export default Events;
