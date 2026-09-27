#include <stdio.h>
#include <stdlib.h>

// create a list type
typedef struct ListElement ListElement;
struct ListElement
{
  char *name;
  struct ListElement *next;
};

// create an element of the list
ListElement* createElement(char* name)
{
  ListElement *newElement;
  
  newElement = (ListElement*)malloc(sizeof(ListElement));
  newElement->name = name;
  newElement->next = NULL;
  
  return newElement;
}

// print all elements of the list
void printList(ListElement *head)
{
  ListElement *temp = head;
  int counter = 0;
  while(temp != NULL)
  {
    printf("Element %d: %s\n", counter, temp->name);
	temp = temp->next;
	counter++;
  }
  printf("\n");
}

// add element to the start of the list
ListElement *addToStart(ListElement *list, ListElement *element)
{
  element->next = list;
  return element;
}

// add element to the end of the list
ListElement *addToEnd(ListElement *list, ListElement *element)
{
  ListElement *temp = list;
  while(temp->next != NULL)
    temp = temp->next;
	
  temp->next = element;
  return list;
}

// delete head of the list
ListElement *deleteHead(ListElement *list)
{
  ListElement *newList = list->next;
  free(list);
  return newList;
}

// delete tail of the list
ListElement *deleteTail(ListElement *list)
{
  ListElement *temp = list;
  
  // list has only one element
  if(temp -> next == NULL)
  {
    free(list);
	return NULL;
  }
  
  // list has more than one element
  while(temp -> next -> next != NULL)
    temp = temp->next;
  
  free(temp -> next -> next);
  temp->next = NULL;
  return list;
}

// delete a specific element with a given name
ListElement* deleteElement(ListElement *list, char *name)
{
  ListElement *curr;
  ListElement *prev;
  for(curr=list; curr!=NULL; curr=curr->next)
  {
    if(strcmp(curr->name, name) == 0)
	{
	  if(prev == NULL)
	    list = list->next;
	  else
	    prev->next = curr->next;
	  free(curr);
	  return list;
	}
	prev = curr;
  }
}

// delete whole list
ListElement* deleteAll(ListElement* list)
{
  ListElement *temp = list;
  for(;;)
  {
    if(temp == NULL)
	  return NULL;
	temp = temp->next;
	free(temp);
  }
}

// inverse a list recursively
ListElement *reverseListRecursively(ListElement *list)
{
  if(list->next == NULL)
    return list;

  ListElement *temp = reverseListRecursively(list->next);
  list->next->next = list;
  list->next = NULL;
  return temp;
}

// inverse a list iteratively
ListElement *reverseListIteratively(ListElement *list)
{
  ListElement *result = NULL;
  ListElement *current = list;
  ListElement *next;
  while(current != NULL)
  {
    next = current->next;
	current->next = result;
	result = current;
	current = next;
  }
  return result;
}

// test method
int main(char **args)
{
  ListElement *one = createElement("One");
  ListElement *two = createElement("Two");
  ListElement *three = createElement("Three");
  ListElement *four = createElement("Four");
    
  ListElement *list = createElement("Initial element");
  
  list = addToStart(list, one);
  list = addToStart(list, two);
  
  list = addToEnd(list, three);
  list = addToEnd(list, four);
  
  printf("Initial List:\n"); 
  printList(list);

  list = reverseListRecursively(list);
  printf("Reversed Recursively:\n");
  printList(list);
  
  list = reverseListIteratively(list);
  printf("Reversed Iteratively:\n");
  printList(list);
  
  list = deleteHead(list);
  printf("After delete head:\n");
  printList(list);
  
  list = deleteTail(list);
  printf("After delete tail:\n");
  printList(list);
  
  list = deleteElement(list, "Initial element");
  printf("After delete \"Initial element\":\n");
  printList(list);
    
  list = deleteAll(list);
  printf("After delete all:\n");
  printList(list);
  
  return 0;
}