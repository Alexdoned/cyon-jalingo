import { Box, Image, Text, Stack, Heading, Badge, Wrap, WrapItem } from '@chakra-ui/react';

function LeaderCard({ leader }) {
  const rawPhotoUrl = leader.photo_url || leader.imageUrl;
  const photoUrl = rawPhotoUrl
    ? (rawPhotoUrl.startsWith('http') ? rawPhotoUrl : `/api/leaders/photo/${rawPhotoUrl.split(/[\/\\]/).pop()}`)
    : 'https://via.placeholder.com/480x250';

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
      <Image src={photoUrl} alt={leader.name} objectFit="cover" w="100%" h="220px" />
      <Box p={5}>
        <Stack spacing={3}>
          <Heading size="md">{leader.name}</Heading>
          <Text color="gray.600">Year: {leader.year}</Text>
          <Text>{leader.achievement}</Text>
        </Stack>
      </Box>
    </Box>
  );
}

export default LeaderCard;
