import { gql, useMutation } from '@apollo/client';

const CREATE_POST = gql`
  mutation CreatePost($title: String!, $content: String!) {
    createPost(title: $title, content: $content) {
      id
      title
      content
    }
  }
`;

function CreatePost() {
  const [createPost, { data }] = useMutation(CREATE_POST);

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        createPost({ variables: { title: 'New Post', content: 'This is a new post.' } });
      }}
    >
      <button type="submit">Add Post</button>
    </form>
  );
}

export default CreatePost
