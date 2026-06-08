import { Box, Image, Badge, Heading, Text, Stack } from '@chakra-ui/react';

function EventCard({ event }) {
  const eventDate = new Date(event.event_date || event.date).toLocaleDateString();
  const imageUrl = event.imageUrl || event.media?.[0]?.file_path || 'https://via.placeholder.com/640x320';

  return (
    <Box
      borderWidth="1px"
      borderRadius="3xl"
      overflow="hidden"
      bg="white"
      shadow="lg"
      transition="transform 0.25s ease, box-shadow 0.25s ease"
      _hover={{ transform: 'translateY(-6px)', boxShadow: '2xl' }}
    >
      <Image src={imageUrl} alt={event.title} objectFit="cover" w="100%" h="220px" />
      <Box p={5}>
        <Stack spacing={3}>
          <Badge colorScheme="purple">{event.venue}</Badge>
          <Heading size="md">{event.title}</Heading>
          <Text fontSize="sm" color="gray.500">{eventDate}</Text>
          <Text>{event.description}</Text>
        </Stack>
      </Box>
    </Box>
  );
}

export default EventCard;
