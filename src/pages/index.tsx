import Head from 'next/head';
import Link from 'next/link';
import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { FiCalendar, FiUser } from 'react-icons/fi';
import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function handleLoadMorePosts(): Promise<void> {
    if (!nextPage) {
      return;
    }

    const nextPosts = await fetch(nextPage);
    const newPostsPagination = await nextPosts.json();

    setPosts([...posts, ...newPostsPagination.results]);
    setNextPage(newPostsPagination.next_page);
  }

  return (
    <>
      <Head>
        <title>Home | Space Traveling</title>
      </Head>
      <main className={commonStyles.container}>
        <section className={commonStyles.content}>
          <div className={styles.posts}>
            {posts?.map(post => (
              <Link key={post.uid} href={`/post/${post.uid}`}>
                <a>
                  <h1>{post.data.title}</h1>
                  <h3>{post.data.subtitle}</h3>
                  <div className={styles.info}>
                    <div>
                      <FiCalendar />
                      {format(
                        parseISO(post.first_publication_date),
                        'dd MMM yyyy',
                        {
                          locale: ptBR,
                        }
                      )}
                    </div>
                    <div>
                      <FiUser /> {post.data.author}
                    </div>
                  </div>
                </a>
              </Link>
            ))}
          </div>
          {nextPage && (
            <div className={styles.loadingMorePosts}>
              <button type="button" onClick={handleLoadMorePosts}>
                Carregar mais posts
              </button>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.uid', 'posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  return {
    props: { postsPagination },
    revalidate: 60 * 10, // 10 minutes
  };
};
