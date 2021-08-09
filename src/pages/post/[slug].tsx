import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  reading_time: string;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const { data, first_publication_date, reading_time } = post;
  const { title, subtitle, author, banner, content } = data;

  return (
    <>
      <Head>
        <title>{title} | Space Traveling</title>
      </Head>
      <main className={commonStyles.container}>
        <header className={styles.banner}>
          <img src={banner.url} alt={title} height="300" />
        </header>
        <div className={commonStyles.content}>
          <article className={styles.post}>
            <h1>{title}</h1>
            <h3>{subtitle}</h3>
            <div className={styles.info}>
              <div>
                <FiCalendar />
                {format(parseISO(first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </div>
              <div>
                <FiUser /> {author}
              </div>
              <div>
                <FiClock /> {` ${reading_time} min`}
              </div>
            </div>
            <section className={styles.bodyContent}>
              {content.map(bodyContent => (
                <div key={bodyContent.heading}>
                  <h2>{bodyContent.heading}</h2>
                  <div
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(bodyContent.body),
                    }}
                  />
                </div>
              ))}
            </section>
          </article>
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.uid'],
      pageSize: 20,
    }
  );

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps<PostProps> = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const currentPost = await prismic.getByUID('posts', String(slug), {});

  if (!currentPost) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const readingTime = currentPost.data.content.reduce((acc, content) => {
    const body = RichText.asText(content.body);
    const split = body.split(' ');
    const wordCounter = split.length;
    const result = Math.ceil(wordCounter / 200);
    return acc + result;
  }, 0);

  const post = {
    first_publication_date: currentPost.first_publication_date,
    reading_time: readingTime,
    data: {
      title: currentPost.data.title,
      subtitle: currentPost.data.subtitle,
      banner: {
        url: currentPost.data.banner?.url,
      },
      author: currentPost.data.author,
      content: currentPost.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 30, // 30 minutos
  };
};
