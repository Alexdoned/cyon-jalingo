import { useEffect, useState } from 'react';
import { Box, Container, Heading, SimpleGrid, Spinner, Text } from '@chakra-ui/react';
import LeaderCard from '../components/LeaderCard';
import api from '../api/axiosConfig';

function Leaders() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/leaders')
      .then((response) => setLeaders(response.data.data || []))
      .catch(() => setLeaders([]))
      .finally(() => setLoading(false));
  }, []);

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
          <Heading mb={6} color="gray.900">Our Leaders</Heading>
          {loading ? (
            <Spinner color="blue.500" />
          ) : leaders.length ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {leaders.map((leader) => (
                <LeaderCard key={leader._id} leader={leader} />
              ))}
            </SimpleGrid>
          ) : (
            <Text color="gray.700">No leader profiles are available yet.</Text>
          )}
        </Box>
      </Container>
    </Box>
  );
}

export default Leaders;
